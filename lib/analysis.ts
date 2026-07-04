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

/* ------------------------------------------------------------------ *
 * Design panel — critique schema
 * ------------------------------------------------------------------ */

export const SEVERITIES = ["critical", "major", "minor"] as const
export type Severity = (typeof SEVERITIES)[number]
export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
}
export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
}

export const DESIGN_SCORE_KEYS = [
  "usability",
  "visualCraft",
  "clarity",
  "accessibility",
  "consistency",
] as const
export type DesignScoreKey = (typeof DESIGN_SCORE_KEYS)[number]
export const DESIGN_SCORE_LABELS: Record<DesignScoreKey, string> = {
  usability: "Usability",
  visualCraft: "Visual craft",
  clarity: "Clarity",
  accessibility: "Accessibility",
  consistency: "Consistency",
}

export const designVerdictSchema = z.object({
  headline: z
    .string()
    .describe("A punchy 6-12 word professional gut reaction to the craft."),
  summary: z
    .string()
    .describe(
      "2-3 sentence first-person critique in this designer's authentic voice and discipline."
    ),
  critique: z
    .string()
    .describe(
      "A rich first-person paragraph (4-6 sentences) evaluating the work through this designer's lens (usability, craft, clarity, accessibility, or consistency)."
    ),
  scores: z
    .object({
      usability: z.number().min(1).max(10),
      visualCraft: z.number().min(1).max(10),
      clarity: z.number().min(1).max(10),
      accessibility: z.number().min(1).max(10),
      consistency: z.number().min(1).max(10),
    })
    .describe("Craft scores 1-10 from this designer's perspective."),
  issues: z
    .array(
      z.object({
        title: z.string().describe("Short name of the design problem."),
        severity: z.enum(SEVERITIES),
        detail: z
          .string()
          .describe("One sentence explaining the issue and its impact."),
      })
    )
    .min(1)
    .max(5)
    .describe("Concrete design problems this designer found."),
  strengths: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe("Specific things the design does well."),
  quotes: z
    .array(
      z.object({
        text: z.string().describe("A vivid verbatim critique quote."),
        topic: z.string().describe("Short topic tag, e.g. 'Layout', 'Type'."),
      })
    )
    .min(1)
    .max(3),
})
export type DesignVerdict = z.infer<typeof designVerdictSchema>

/* ------------------------------------------------------------------ *
 * Startup panel — investment memo schema
 * ------------------------------------------------------------------ */

export const INVEST_VERDICTS = [
  "invest",
  "lean_invest",
  "neutral",
  "caution",
  "pass",
] as const
export type InvestVerdict = (typeof INVEST_VERDICTS)[number]
export const INVEST_LABELS: Record<InvestVerdict, string> = {
  invest: "Invest",
  lean_invest: "Lean invest",
  neutral: "Neutral",
  caution: "Caution",
  pass: "Pass",
}

export const STARTUP_SCORE_KEYS = [
  "viability",
  "market",
  "moat",
  "gtm",
  "financials",
] as const
export type StartupScoreKey = (typeof STARTUP_SCORE_KEYS)[number]
export const STARTUP_SCORE_LABELS: Record<StartupScoreKey, string> = {
  viability: "Viability",
  market: "Market",
  moat: "Moat",
  gtm: "GTM",
  financials: "Financials",
}

export const startupVerdictSchema = z.object({
  headline: z
    .string()
    .describe("A punchy 6-12 word investor gut reaction to the opportunity."),
  summary: z
    .string()
    .describe(
      "2-3 sentence first-person take in this operator/investor's authentic voice."
    ),
  memo: z
    .string()
    .describe(
      "A rich first-person paragraph (4-6 sentences) pressure-testing the business through this expert's lens (viability, market, moat, GTM, or financials)."
    ),
  scores: z
    .object({
      viability: z.number().min(1).max(10),
      market: z.number().min(1).max(10),
      moat: z.number().min(1).max(10),
      gtm: z.number().min(1).max(10),
      financials: z.number().min(1).max(10),
    })
    .describe("Investment scores 1-10 from this expert's perspective."),
  verdict: z
    .enum(INVEST_VERDICTS)
    .describe("This expert's overall investment stance."),
  bull: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("Reasons this could be a big win (the bull case)."),
  bear: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("Reasons this could fail (the bear case)."),
  risks: z
    .array(z.string())
    .max(4)
    .describe("Specific risks to diligence before investing."),
  quotes: z
    .array(
      z.object({
        text: z.string().describe("A vivid verbatim memo quote."),
        topic: z.string().describe("Short topic tag, e.g. 'Market', 'Moat'."),
      })
    )
    .min(1)
    .max(3),
})
export type StartupVerdict = z.infer<typeof startupVerdictSchema>
