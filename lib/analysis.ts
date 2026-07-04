import { z } from "zod"

/* ------------------------------------------------------------------ *
 * Enums + human-readable labels
 * ------------------------------------------------------------------ */

export const INTENT_TIERS = [
  "definitely",
  "probably",
  "maybe",
  "probably_not",
  "definitely_not",
] as const
export type IntentTier = (typeof INTENT_TIERS)[number]

export const INTENT_LABELS: Record<IntentTier, string> = {
  definitely: "Definitely would buy",
  probably: "Probably would buy",
  maybe: "Might / might not",
  probably_not: "Probably would not",
  definitely_not: "Definitely would not",
}

/** Numeric weight used to compute a 0-100 intent index. */
export const INTENT_WEIGHT: Record<IntentTier, number> = {
  definitely: 100,
  probably: 75,
  maybe: 50,
  probably_not: 25,
  definitely_not: 0,
}

export const TIMINGS = ["immediate", "six_months", "v2", "never"] as const
export type Timing = (typeof TIMINGS)[number]
export const TIMING_LABELS: Record<Timing, string> = {
  immediate: "Immediately",
  six_months: "Next 6 months",
  v2: "Waiting for v2",
  never: "Never",
}

export const VALUE_CLASSES = ["painkiller", "vitamin", "neither"] as const
export type ValueClass = (typeof VALUE_CLASSES)[number]
export const VALUE_CLASS_LABELS: Record<ValueClass, string> = {
  painkiller: "Must-have (painkiller)",
  vitamin: "Nice-to-have (vitamin)",
  neither: "Neither",
}

export const PRICING_MODELS = ["subscription", "flat_fee", "either"] as const
export type PricingModel = (typeof PRICING_MODELS)[number]
export const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  subscription: "Subscription",
  flat_fee: "One-time / flat fee",
  either: "No strong preference",
}

export const EMOTION_KEYS = [
  "delight",
  "excitement",
  "confusion",
  "frustration",
  "skepticism",
  "indifference",
] as const
export type EmotionKey = (typeof EMOTION_KEYS)[number]
export const EMOTION_LABELS: Record<EmotionKey, string> = {
  delight: "Delight",
  excitement: "Excitement",
  confusion: "Confusion",
  frustration: "Frustration",
  skepticism: "Skepticism",
  indifference: "Indifference",
}

export const QUOTE_SENTIMENTS = ["positive", "neutral", "negative"] as const
export type QuoteSentiment = (typeof QUOTE_SENTIMENTS)[number]

/* ------------------------------------------------------------------ *
 * Per-persona verdict schema (what each agent returns)
 * ------------------------------------------------------------------ */

export const personaVerdictSchema = z.object({
  headline: z
    .string()
    .describe("A punchy 6-12 word gut reaction, in the persona's own voice."),
  summary: z
    .string()
    .describe(
      "2-3 sentence first-person reaction to the content, in the persona's authentic voice and vocabulary."
    ),
  detailedFeedback: z
    .string()
    .describe(
      "A rich first-person paragraph (4-6 sentences) explaining what resonated, what fell flat, and why, grounded in this persona's life and priorities."
    ),

  sentiment: z.object({
    net: z
      .number()
      .min(-100)
      .max(100)
      .describe(
        "Net sentiment from -100 (hostile) to +100 (enthusiastic). 0 is neutral."
      ),
    emotions: z
      .object({
        delight: z.number().min(0).max(100),
        excitement: z.number().min(0).max(100),
        confusion: z.number().min(0).max(100),
        frustration: z.number().min(0).max(100),
        skepticism: z.number().min(0).max(100),
        indifference: z.number().min(0).max(100),
      })
      .describe(
        "Intensity 0-100 of each core emotion this persona feels. Values should reflect the emotional mix, they do NOT need to sum to 100."
      ),
    volatility: z
      .number()
      .min(0)
      .max(100)
      .describe(
        "How sharply this persona's reaction swings across different parts of the content. 0 = steady, 100 = wildly reactive."
      ),
  }),

  appeal: z.object({
    features: z
      .array(
        z.object({
          name: z
            .string()
            .describe("Short name of a specific feature or value proposition."),
          score: z
            .number()
            .min(1)
            .max(10)
            .describe("Appeal of this feature to this persona, 1-10."),
        })
      )
      .min(2)
      .max(5)
      .describe("The 2-5 most notable features/claims and their appeal."),
    aesthetics: z
      .number()
      .min(1)
      .max(10)
      .describe(
        "Reaction to design, packaging, wording, or visual/UX polish, 1-10."
      ),
    classification: z.enum(VALUE_CLASSES),
  }),

  price: z.object({
    currency: z
      .string()
      .describe("ISO-like currency symbol or code, e.g. '$' or 'USD'."),
    tooCheap: z
      .number()
      .describe("Price so low it feels suspicious / low quality."),
    cheap: z.number().describe("Price that feels like a good bargain."),
    expensive: z
      .number()
      .describe("Price that feels premium but still acceptable."),
    tooExpensive: z.number().describe("Price that is an absolute dealbreaker."),
    wtpMin: z.number().describe("Minimum this persona would realistically pay."),
    wtpMax: z.number().describe("Maximum this persona would realistically pay."),
    model: z.enum(PRICING_MODELS),
  }),

  intent: z.object({
    tier: z.enum(INTENT_TIERS),
    timing: z.enum(TIMINGS),
    frictions: z
      .array(z.string())
      .max(4)
      .describe(
        "Specific barriers preventing adoption, e.g. 'Switching costs', 'Privacy concern', 'Too complex'. Empty if none."
      ),
  }),

  trust: z.object({
    score: z
      .number()
      .min(1)
      .max(5)
      .describe("Perceived trust / credibility, 1 (none) to 5 (complete)."),
    risks: z
      .array(z.string())
      .max(4)
      .describe(
        "Specific anxieties, e.g. 'Data privacy', 'Financial risk', 'Social stigma'."
      ),
    skepticismTriggers: z
      .array(
        z.object({
          claim: z
            .string()
            .describe("The exact claim or phrase that was doubted."),
          reason: z.string().describe("Why this persona doubted it."),
        })
      )
      .max(3)
      .describe("Moments in the content this persona openly questioned."),
  }),

  quotes: z
    .array(
      z.object({
        text: z.string().describe("A vivid verbatim quote in the persona's voice."),
        topic: z
          .string()
          .describe("Short topic tag, e.g. 'Pricing', 'Design', 'Trust'."),
        sentiment: z.enum(QUOTE_SENTIMENTS),
        metric: z
          .enum([
            "sentiment",
            "appeal",
            "price",
            "intent",
            "trust",
          ])
          .describe("Which metric dimension this quote best evidences."),
      })
    )
    .min(2)
    .max(5)
    .describe("Memorable pull-quotes that justify the scores above."),
})

export type PersonaVerdict = z.infer<typeof personaVerdictSchema>
