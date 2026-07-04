import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import {
  personaVerdictSchema,
  designVerdictSchema,
  startupVerdictSchema,
} from "@/lib/analysis"
import type { Persona, PanelResponse, PanelId, Session } from "@/lib/types"

export const maxDuration = 120

const MODEL = openai("gpt-5.5")
const MAX_CONTENT_CHARS = 9000

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

type ResolvedContent = { content: string; pageTitle?: string }

async function resolveContent(
  mode: "text" | "url",
  source: string
): Promise<ResolvedContent> {
  if (mode === "text") {
    return { content: source.slice(0, MAX_CONTENT_CHARS) }
  }

  let url = source.trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; PanelFocusGroup/1.0; +https://vercel.com)",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    throw new Error(`Could not fetch that URL (status ${res.status}).`)
  }
  const html = await res.text()
  const pageTitle = extractPageTitle(html)
  const text = htmlToText(html)
  if (text.length < 40) {
    throw new Error(
      "That URL did not return enough readable text to analyze. Try pasting the content directly."
    )
  }
  return { content: text.slice(0, MAX_CONTENT_CHARS), pageTitle }
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

function buildPrompt(persona: Persona, content: string): string {
  return `# Your persona
${personaBlock(persona)}

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
  try {
    const resolved = await resolveContent(mode, source)
    content = resolved.content
    pageTitle = resolved.pageTitle
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to read content." },
      { status: 400 }
    )
  }

  const settled = await Promise.allSettled(
    personas.map(async (persona) => {
      const { object } = await generateObject({
        model: MODEL,
        schema: config.schema,
        system: config.system,
        prompt: buildPrompt(persona, content),
      })
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
    responses: responses as Session["responses"],
  }

  return Response.json({ session })
}
