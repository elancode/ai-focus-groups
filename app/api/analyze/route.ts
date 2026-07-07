import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import {
  personaVerdictSchema,
  designVerdictSchema,
  startupVerdictSchema,
} from "@/lib/analysis"
import { capturePage } from "@/lib/screenshot"
import { isLikelyUrl, extractUrl } from "@/lib/format"
import { recordRun } from "@/lib/metrics"
import { MAX_PANELISTS, PANELS } from "@/lib/panels"
import type {
  Persona,
  PanelResponse,
  PanelId,
  Session,
  AnalysisMode,
} from "@/lib/types"

export const maxDuration = 120

const MODEL = openai("gpt-5.5")
const MAX_CONTENT_CHARS = 9000

function normalizeUrl(source: string): string {
  const url = source.trim()
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

type AnalyzeBody = {
  source: string
  personas: Persona[]
  panel?: PanelId
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Pull the page's declared title from raw HTML. Prefers og:title, then the
 * <title> tag, then the first <h1> — all of which are the site/page title and
 * never contain nav-bar links (unlike the scraped body text).
 */
function extractPageTitle(html: string): string | undefined {
  const metaTags = html.match(/<meta[^>]*>/gi) ?? []
  const ogTag = metaTags.find((t) =>
    /(?:property|name)=["']og:title["']/i.test(t)
  )
  const ogTitle = ogTag?.match(/content=(["'])(.*?)\1/i)?.[2]
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
  const raw = htmlToText(ogTitle ?? titleTag ?? h1 ?? "")
  return raw.length >= 3 ? raw : undefined
}

type ResolvedContent = {
  content: string
  pageTitle?: string
  screenshot?: Uint8Array
  /** True when a linked page actually contributed text and/or a screenshot. */
  usedUrl: boolean
  /** Best text to derive the run title from (page text preferred, else user note). */
  titleSource: string
}

/** Plain HTML fetch → text + title. Returns null on any failure (so the browser can still try). */
async function fetchHtml(
  url: string
): Promise<{ text: string; title?: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PanelFocusGroup/1.0; +https://vercel.com)",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const html = await res.text()
    return { text: htmlToText(html), title: extractPageTitle(html) }
  } catch {
    return null
  }
}

/**
 * Assemble the labeled content block sent to the model. When the user wrote
 * their own note AND we fetched a page, both are included under clear headings
 * so the model never confuses "the thing to review" with "the submitter's ask".
 * The total is capped, trimming the (long) page text first so the user's note
 * always survives intact.
 */
function composeContent(parts: {
  userText: string
  pageText: string
  url: string | null
  hasScreenshot: boolean
}): string {
  const { userText, pageText, url, hasScreenshot } = parts
  const pageBody =
    pageText ||
    (hasScreenshot
      ? "(Little extractable text on this page — evaluate primarily from the attached screenshot.)"
      : "")

  if (userText && pageBody) {
    const noteBlock = `# The submitter's own notes / request\n"""\n${userText}\n"""`
    const header = `\n\n# Content fetched from the linked page (${url})\n"""\n`
    const footer = `\n"""`
    const budget =
      MAX_CONTENT_CHARS - noteBlock.length - header.length - footer.length
    const page = budget > 0 ? pageBody.slice(0, budget) : ""
    return `${noteBlock}${header}${page}${footer}`
  }

  if (pageBody) {
    return `# Content fetched from the linked page (${url})\n"""\n${pageBody.slice(
      0,
      MAX_CONTENT_CHARS
    )}\n"""`
  }

  // No usable page — the user's text is itself the thing to evaluate.
  const body = userText || "(No readable content was retrieved.)"
  return `# Content to evaluate\n"""\n${body.slice(0, MAX_CONTENT_CHARS)}\n"""`
}

/**
 * Retrieve any URL found in the input (best-effort: page text + screenshot) and
 * combine it with the user's own text. Retrieval never hard-fails unless the
 * panel *requires* a page (Design) or the input was a lone URL that produced
 * nothing at all.
 */
async function resolveContent(
  source: string,
  requiresUrl: boolean
): Promise<ResolvedContent> {
  const url = extractUrl(source)
  const soleUrl = Boolean(url && isLikelyUrl(source))
  // The user's own note — empty when they pasted only a link.
  const userText = soleUrl ? "" : source.trim()

  let pageText = ""
  let pageTitle: string | undefined
  let screenshot: Uint8Array | undefined

  if (url) {
    const target = normalizeUrl(url)
    // Always capture the screenshot now — every panel can reason over it.
    const [raw, cap] = await Promise.all([
      fetchHtml(target),
      capturePage(target),
    ])
    const rawText = raw?.text ?? ""
    const capPage = cap.ok ? cap.page : null
    const browserText = capPage?.text ?? ""
    pageText =
      [browserText, rawText]
        .filter((t) => t.length >= 40)
        .sort((a, b) => b.length - a.length)[0] ?? ""
    pageTitle = raw?.title ?? capPage?.title
    screenshot = capPage?.screenshot
  }

  const gotPage = Boolean(pageText || screenshot)
  const usedUrl = Boolean(url && gotPage)

  // Design reviews the rendered page — it needs a page we could actually open.
  if (requiresUrl && !gotPage) {
    throw new Error(
      "Design review needs a page URL it can open. Paste a link like https://example.com."
    )
  }
  // A lone URL that failed entirely (no text, no screenshot, no note to fall
  // back on) is a hard failure — there is nothing to analyze.
  if (soleUrl && !gotPage && !userText) {
    throw new Error(
      "Couldn't render this page or extract enough readable text to analyze. Try pasting the content directly."
    )
  }

  const content = composeContent({
    userText,
    pageText,
    url,
    hasScreenshot: Boolean(screenshot),
  })

  return {
    content,
    pageTitle,
    screenshot,
    usedUrl,
    titleSource: pageText || userText,
  }
}

/**
 * Drop a trailing site-name suffix and cap length. Only splits on pipe/middot
 * ("Buy AirPods | Apple" → "Buy AirPods"); dashes and colons are kept because
 * they're usually part of the real title ("Aura — AI Sleep Coach").
 */
function trimSiteName(raw: string): string {
  let s = raw.split(/\s[|·]\s/)[0].trim() || raw.trim()
  if (s.length > 72) s = `${s.slice(0, 72).replace(/\s+\S*$/, "")}…`
  return s
}

/** Words that signal scraped nav/marketing chrome (only stripped from body-text fallback). */
const NAV_NOISE =
  /\b(sign in|sign up|log ?in|try (it )?(now|free)|get started|menu|pricing|careers|search)\b/gi

function buildTitle(content: string, pageTitle?: string): string {
  // Prefer the page's real title tag — it is the site title, never nav text.
  if (pageTitle) {
    const t = trimSiteName(pageTitle)
    if (t.length >= 3) return t
  }
  // Fallback only when no title tag exists: strip obvious nav/marketing chrome.
  const clean = content.replace(NAV_NOISE, " ").replace(/\s+/g, " ").trim()
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean
  const base = firstSentence.length > 64 ? clean.slice(0, 64) : firstSentence
  return base.length < clean.length ? `${base.replace(/[.!?]+$/, "")}…` : base
}

/* ------------------------------------------------------------------ *
 * Per-panel system prompts + schemas
 * ------------------------------------------------------------------ */

const CONSUMER_SYSTEM = `You are an expert qualitative market researcher running a synthetic focus group.
You will fully embody a single participant persona and react to a piece of content
(which may be a product concept, an advertisement, a speech, a landing page, or any pitch).

Rules:
- Stay 100% in character. React the way THIS person would, using their vocabulary, biases, budget, and priorities.
- Be honest and specific, not generically positive. Real people are critical, distracted, and skeptical.
- Ground every score in the persona's described life. A retiree on a fixed income and a startup founder should not answer alike.
- Price fields must be realistic numbers for what THIS content would plausibly cost, in a sensible currency for the persona.
- Only cite claims that actually appear in the content for skepticism triggers.
- Return ONLY structured data that matches the provided schema.`

const DESIGN_SYSTEM = `You are running a synthetic design review with a panel of working designers.
You will fully embody a single designer and critique a piece of work (a product concept,
landing page, ad, or interface) through the lens of their discipline.

Rules:
- Stay 100% in character as this specific designer, using their discipline's vocabulary and standards.
- Judge craft honestly. Real design reviews are specific, critical, and cite concrete problems — not vague praise.
- Score usability, visual craft, clarity, accessibility, and consistency from THIS designer's point of view (1-10).
- Every issue must be concrete and actionable, tagged with a severity (critical / major / minor).
- Ground critiques in what actually appears in the content.
- Return ONLY structured data that matches the provided schema.`

const STARTUP_SYSTEM = `You are convening a synthetic expert panel of startup operators and investors.
You will fully embody a single operator/investor and pressure-test a business idea
(a product concept, pitch, or landing page) through the lens of their expertise.

Rules:
- Stay 100% in character as this specific operator/investor, using their vocabulary and mental models.
- Be rigorous and skeptical, the way a real investment memo is. Name the bull case AND the bear case.
- Score viability, market, moat, GTM, and financials from THIS expert's point of view (1-10).
- Give an overall investment verdict; be willing to pass.
- Ground every point in what actually appears in the content.
- BREVITY IS REQUIRED. Bull and bear points are single short lines (no "I think", no attribution). Risks are SHORT noun phrases (2-5 words), never sentences. Your memo/summary is at most 2 sentences.
- Output ONLY final, user-facing copy in the requested fields. Never include notes to yourself, reasoning, editing scratch, or meta-commentary (e.g. "hmm", "need clean final", "remove this"). Every field must read as polished text.
- Return ONLY structured data that matches the provided schema.`

const PANEL_CONFIG = {
  consumer: { system: CONSUMER_SYSTEM, schema: personaVerdictSchema },
  design: { system: DESIGN_SYSTEM, schema: designVerdictSchema },
  startup: { system: STARTUP_SYSTEM, schema: startupVerdictSchema },
} as const

function personaBlock(persona: Persona): string {
  const roleLine = persona.subtitle
    ? `Role: ${persona.subtitle}`
    : `Generation: ${persona.cohort}\nAge: ${persona.age}\nOccupation: ${persona.occupation}\nLocation: ${persona.location}`
  const lens = persona.specialty ?? persona.archetype
  return `Name: ${persona.name}
Focus / lens: ${lens}
${roleLine}
Defining traits: ${persona.traits.join(", ")}
Background: ${persona.bio}`
}

/**
 * The invariant part of the prompt — identical for every panelist in a run, so
 * (together with the system prompt and image) it forms a cacheable prefix.
 * Kept FIRST in the message; the per-persona ask goes last.
 */
function sharedBlock(content: string, hasScreenshot: boolean): string {
  const shotNote = hasScreenshot
    ? `A screenshot of the page is attached. Base your judgments about visual design — layout, hierarchy, spacing, typography, colour, and contrast — on what you actually SEE in the screenshot. Use the text below for copy and content.\n\n`
    : ""
  // `content` is already structured with its own labeled, quoted sections, so we
  // only prepend the screenshot preamble (when present) — no extra wrapping.
  return `${shotNote}${content}`
}

/** The per-persona part of the prompt — the only thing that varies; placed last. */
function personaAsk(persona: Persona): string {
  return `# Your panelist
${personaBlock(persona)}

React to the content above as ${persona.name}. Provide your honest, in-character assessment and all requested fields.`
}

export async function POST(req: Request) {
  try {
    return await handleAnalyze(req)
  } catch (err) {
    console.log("[analyze] unhandled error:", err)
    return Response.json(
      { error: "The analysis failed unexpectedly. Please try again." },
      { status: 500 }
    )
  }
}

async function handleAnalyze(req: Request) {
  let body: AnalyzeBody
  try {
    body = (await req.json()) as AnalyzeBody
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { source, personas } = body
  const panel: PanelId = body.panel ?? "consumer"
  const config = PANEL_CONFIG[panel] ?? PANEL_CONFIG.consumer
  const requiresUrl = PANELS[panel]?.requiresUrl ?? false

  if (!source?.trim()) {
    return Response.json(
      { error: "Please provide a URL or some text to analyze." },
      { status: 400 }
    )
  }
  if (!personas?.length) {
    return Response.json(
      { error: "Select at least one panelist for your study." },
      { status: 400 }
    )
  }

  let content: string
  let pageTitle: string | undefined
  let screenshotBytes: Uint8Array | undefined
  let titleSource: string
  let usedUrl: boolean
  try {
    const resolved = await resolveContent(source, requiresUrl)
    content = resolved.content
    pageTitle = resolved.pageTitle
    screenshotBytes = resolved.screenshot
    titleSource = resolved.titleSource
    usedUrl = resolved.usedUrl
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to read content."
    await recordRun({
      createdAt: new Date(),
      panel,
      mode: extractUrl(source) ? "url" : "text",
      source,
      title: source.slice(0, 80),
      panelistCount: 0,
      tokensInput: 0,
      tokensOutput: 0,
      ok: false,
      error: message,
      responses: [],
    })
    return Response.json({ error: message }, { status: 400 })
  }

  // Single source of truth for the run's label — did a linked page contribute?
  const mode: AnalysisMode = usedUrl ? "url" : "text"

  // The screenshot is now a vision input for every panel (when we captured one).
  const visionShot = screenshotBytes ?? null

  // Cap the run (defense-in-depth; the UI already enforces this).
  const members = personas.slice(0, MAX_PANELISTS)

  // Shared, invariant prefix (system + image + this block) is identical across
  // panelists, so OpenAI caches it after the first call.
  const shared = sharedBlock(content, Boolean(visionShot))

  type PanelistResult = {
    value: PanelResponse<unknown>
    usage: { input: number; output: number }
  }

  async function runPanelist(persona: Persona): Promise<PanelistResult> {
    const userContent = visionShot
      ? [
          { type: "image" as const, image: visionShot },
          { type: "text" as const, text: shared },
          { type: "text" as const, text: personaAsk(persona) },
        ]
      : [
          { type: "text" as const, text: shared },
          { type: "text" as const, text: personaAsk(persona) },
        ]
    const result = await generateObject({
      model: MODEL,
      schema: config.schema,
      system: config.system,
      messages: [{ role: "user", content: userContent }],
    })
    const u = result.usage as {
      inputTokens?: number
      outputTokens?: number
      promptTokens?: number
      completionTokens?: number
    }
    const usage = {
      input: u?.inputTokens ?? u?.promptTokens ?? 0,
      output: u?.outputTokens ?? u?.completionTokens ?? 0,
    }
    console.log(
      "[analyze] panelist",
      persona.id,
      "usage",
      JSON.stringify(result.usage)
    )
    return {
      value: { persona, verdict: result.object } as PanelResponse<unknown>,
      usage,
    }
  }

  // Warm the shared-prefix cache with the first panelist, then run the rest in
  // parallel so they read the cached prefix.
  const settled: PromiseSettledResult<PanelistResult>[] = []
  const [firstPersona, ...restPersonas] = members
  try {
    settled.push({
      status: "fulfilled",
      value: await runPanelist(firstPersona),
    })
  } catch (reason) {
    settled.push({ status: "rejected", reason })
  }
  if (restPersonas.length) {
    settled.push(...(await Promise.allSettled(restPersonas.map(runPanelist))))
  }

  const responses: PanelResponse<unknown>[] = []
  let tokensInput = 0
  let tokensOutput = 0
  for (const r of settled) {
    if (r.status === "fulfilled") {
      responses.push(r.value.value)
      tokensInput += r.value.usage.input
      tokensOutput += r.value.usage.output
    } else {
      console.log("[v0] panelist analysis failed:", r.reason)
    }
  }

  const title = buildTitle(titleSource, pageTitle)

  if (responses.length === 0) {
    await recordRun({
      createdAt: new Date(),
      panel,
      mode,
      source,
      title,
      panelistCount: 0,
      tokensInput,
      tokensOutput,
      ok: false,
      error: "no responses generated",
      responses: [],
    })
    return Response.json(
      {
        error:
          "The panel could not generate feedback. Please try again in a moment.",
      },
      { status: 502 }
    )
  }

  const session: Session = {
    id: `session-${Date.now()}`,
    createdAt: Date.now(),
    title,
    mode,
    source,
    content,
    panel,
    screenshot: screenshotBytes
      ? `data:image/jpeg;base64,${Buffer.from(screenshotBytes).toString("base64")}`
      : undefined,
    responses: responses as Session["responses"],
  }

  await recordRun({
    createdAt: new Date(session.createdAt),
    panel,
    mode,
    source,
    title,
    panelistCount: responses.length,
    tokensInput,
    tokensOutput,
    ok: true,
    responses: responses.map((r) => ({
      persona: {
        id: r.persona.id,
        name: r.persona.name,
        subtitle: r.persona.subtitle,
        archetype: r.persona.archetype,
        cohort: r.persona.cohort,
      },
      verdict: r.verdict,
    })),
  })

  return Response.json({ session })
}
