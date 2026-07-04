import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { personaVerdictSchema } from "@/lib/analysis"
import type { Persona, PanelResponse, Session } from "@/lib/types"

export const maxDuration = 120

const MODEL = openai("gpt-5.5")
const MAX_CONTENT_CHARS = 9000

type AnalyzeBody = {
  mode: "text" | "url"
  source: string
  personas: Persona[]
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

async function resolveContent(
  mode: "text" | "url",
  source: string
): Promise<string> {
  if (mode === "text") return source.slice(0, MAX_CONTENT_CHARS)

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
  const text = htmlToText(html)
  if (text.length < 40) {
    throw new Error(
      "That URL did not return enough readable text to analyze. Try pasting the content directly."
    )
  }
  return text.slice(0, MAX_CONTENT_CHARS)
}

function buildTitle(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim()
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean
  const base = firstSentence.length > 64 ? clean.slice(0, 64) : firstSentence
  return base.length < clean.length ? `${base.replace(/[.!?]+$/, "")}…` : base
}

const SYSTEM_PREAMBLE = `You are an expert qualitative market researcher running a synthetic focus group.
You will fully embody a single participant persona and react to a piece of content
(which may be a product concept, an advertisement, a speech, a landing page, or any pitch).

Rules:
- Stay 100% in character. React the way THIS person would, using their vocabulary, biases, budget, and priorities.
- Be honest and specific, not generically positive. Real people are critical, distracted, and skeptical.
- Ground every score in the persona's described life. A retiree on a fixed income and a startup founder should not answer alike.
- Price fields must be realistic numbers for what THIS content would plausibly cost, in a sensible currency for the persona.
- Only cite claims that actually appear in the content for skepticism triggers.
- Return ONLY structured data that matches the provided schema.`

function buildPrompt(persona: Persona, content: string): string {
  return `# Your persona
Name: ${persona.name}
Archetype: ${persona.archetype}
Generation: ${persona.cohort}
Age: ${persona.age}
Occupation: ${persona.occupation}
Location: ${persona.location}
Defining traits: ${persona.traits.join(", ")}
Background: ${persona.bio}

# Content to evaluate
"""
${content}
"""

React to this content as ${persona.name}. Provide your honest, in-character feedback and all requested metrics.`
}

export async function POST(req: Request) {
  let body: AnalyzeBody
  try {
    body = (await req.json()) as AnalyzeBody
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { mode, source, personas } = body
  if (!source?.trim()) {
    return Response.json(
      { error: "Please provide a URL or some text to analyze." },
      { status: 400 }
    )
  }
  if (!personas?.length) {
    return Response.json(
      { error: "Select at least one persona for your panel." },
      { status: 400 }
    )
  }

  let content: string
  try {
    content = await resolveContent(mode, source)
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
        schema: personaVerdictSchema,
        system: SYSTEM_PREAMBLE,
        prompt: buildPrompt(persona, content),
      })
      return { persona, verdict: object } satisfies PanelResponse
    })
  )

  const responses: PanelResponse[] = []
  for (const r of settled) {
    if (r.status === "fulfilled") responses.push(r.value)
    else console.log("[v0] persona analysis failed:", r.reason)
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
    title: buildTitle(content),
    mode,
    source,
    content,
    responses,
  }

  return Response.json({ session })
}
