import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import {
  personaVerdictSchema,
  designVerdictSchema,
  startupVerdictSchema,
} from "@/lib/analysis"
import { capturePage } from "@/lib/screenshot"
import type { Persona, PanelResponse, PanelId, Session } from "@/lib/types"

export const maxDuration = 120

const MODEL = openai("gpt-5.5")
const MAX_CONTENT_CHARS = 9000

function normalizeUrl(source: string): string {
  const url = source.trim()
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

type AnalyzeBody = {
  mode: "text" | "url"
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

async function resolveContent(
  mode: "text" | "url",
  source: string,
  wantScreenshot: boolean
): Promise<ResolvedContent> {
  if (mode === "text") {
    return { content: source.slice(0, MAX_CONTENT_CHARS) }
  }

  const url = normalizeUrl(source)

  // Raw fetch is cheap; use the browser when we need a screenshot, or when the
  // raw HTML has too little text (JS-rendered pages that only a browser sees).
  const raw = await fetchHtml(url)
  const rawText = raw?.text ?? ""
  const useBrowser = wantScreenshot || rawText.length < 40
  const cap = useBrowser ? await capturePage(url) : null
  const capPage = cap && cap.ok ? cap.page : null
  const capError = cap && !cap.ok ? cap.error : undefined
  const browserText = capPage?.text ?? ""

  const best =
    [browserText, rawText]
      .filter((t) => t.length >= 40)
      .sort((a, b) => b.length - a.length)[0] ?? ""

  const pageTitle = raw?.title ?? capPage?.title
  const screenshot = capPage?.screenshot

  if (best.length < 40) {
    // For the Design panel the screenshot IS the content — don't hard-fail on
    // a page with little extractable text; let the reviewers judge the image.
    if (screenshot) {
      return {
        content:
          best ||
          "(Little extractable text on this page — evaluate the design primarily from the attached screenshot.)",
        pageTitle,
        screenshot,
      }
    }
    // We needed the browser (screenshot wanted, or the raw fetch was thin) but
    // it produced nothing — a distinct failure from a genuinely empty page.
    if (useBrowser && !capPage) {
      throw new Error(
        capError
          ? `Couldn't render this page in a browser — ${capError}. Try pasting the page text instead.`
          : "Couldn't render this page in a browser. Try pasting the page text instead."
      )
    }
    throw new Error(
      "That URL did not return enough readable text to analyze. Try pasting the content directly."
    )
  }

  return { content: best.slice(0, MAX_CONTENT_CHARS), pageTitle, screenshot }
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

function buildPrompt(
  persona: Persona,
  content: string,
  hasScreenshot = false
): string {
  const shotNote = hasScreenshot
    ? `\n# Screenshot
A screenshot of the page is attached. Base your judgments about visual design — layout, hierarchy, spacing, typography, colour, and contrast — on what you actually SEE in the screenshot. Use the extracted text below for copy and content.\n`
    : ""
  return `# Your persona
${personaBlock(persona)}
${shotNote}
# Content to evaluate
"""
${content}
"""

React to this content as ${persona.name}. Provide your honest, in-character assessment and all requested fields.`
}

export async function POST(req: Request) {
  let body: AnalyzeBody
  try {
    body = (await req.json()) as AnalyzeBody
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { mode, source, personas } = body
  const panel: PanelId = body.panel ?? "consumer"
  const config = PANEL_CONFIG[panel] ?? PANEL_CONFIG.consumer

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
  try {
    // Design judges craft, so it always wants a screenshot; other panels only
    // fall back to the browser when the raw fetch has too little text.
    const resolved = await resolveContent(mode, source, panel === "design")
    content = resolved.content
    pageTitle = resolved.pageTitle
    screenshotBytes = resolved.screenshot
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to read content." },
      { status: 400 }
    )
  }

  // The screenshot is a vision input only for the Design panel; other panels
  // still store it (for display) but reason over text.
  const visionShot = panel === "design" ? screenshotBytes ?? null : null

  const settled = await Promise.allSettled(
    personas.map(async (persona) => {
      const text = buildPrompt(persona, content, Boolean(visionShot))
      const base = {
        model: MODEL,
        schema: config.schema,
        system: config.system,
      }
      const { object } = visionShot
        ? await generateObject({
            ...base,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text },
                  { type: "image", image: visionShot },
                ],
              },
            ],
          })
        : await generateObject({ ...base, prompt: text })
      return { persona, verdict: object } as PanelResponse<unknown>
    })
  )

  const responses: PanelResponse<unknown>[] = []
  for (const r of settled) {
    if (r.status === "fulfilled") responses.push(r.value)
    else console.log("[v0] panelist analysis failed:", r.reason)
  }

  if (responses.length === 0) {
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
    title: buildTitle(content, pageTitle),
    mode,
    source,
    content,
    panel,
    screenshot: screenshotBytes
      ? `data:image/jpeg;base64,${Buffer.from(screenshotBytes).toString("base64")}`
      : undefined,
    responses: responses as Session["responses"],
  }

  return Response.json({ session })
}
