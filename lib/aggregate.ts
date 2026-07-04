import {
  DESIGN_SCORE_KEYS,
  EMOTION_KEYS,
  EMOTION_LABELS,
  INTENT_LABELS,
  INTENT_TIERS,
  INTENT_WEIGHT,
  PRICING_MODEL_LABELS,
  PRICING_MODELS,
  SEVERITY_RANK,
  STARTUP_SCORE_KEYS,
  TIMING_LABELS,
  TIMINGS,
  VALUE_CLASS_LABELS,
  VALUE_CLASSES,
  type DesignScoreKey,
  type DesignVerdict,
  type EmotionKey,
  type InvestVerdict,
  type IntentTier,
  type PricingModel,
  type Severity,
  type StartupScoreKey,
  type StartupVerdict,
  type Timing,
  type ValueClass,
} from "./analysis"
import type { Cohort, PanelResponse } from "./types"

const round = (n: number, digits = 0) => {
  const f = 10 ** digits
  return Math.round(n * f) / f
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

export function dominantCurrency(responses: PanelResponse[]): string {
  const counts = new Map<string, number>()
  for (const r of responses) {
    const c = r.verdict.price.currency || "$"
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  let best = "$"
  let bestN = -1
  for (const [c, n] of counts) {
    if (n > bestN) {
      best = c
      bestN = n
    }
  }
  return best
}

export type Overview = {
  panelSize: number
  netSentiment: number
  intentIndex: number
  avgTrust: number
  avgAesthetics: number
  volatility: number
  currency: string
  vanWestendorp: {
    tooCheap: number
    cheap: number
    expensive: number
    tooExpensive: number
  }
  wtpMin: number
  wtpMax: number
}

export function buildOverview(responses: PanelResponse[]): Overview {
  return {
    panelSize: responses.length,
    netSentiment: round(avg(responses.map((r) => r.verdict.sentiment.net))),
    intentIndex: round(
      avg(responses.map((r) => INTENT_WEIGHT[r.verdict.intent.tier]))
    ),
    avgTrust: round(avg(responses.map((r) => r.verdict.trust.score)), 1),
    avgAesthetics: round(
      avg(responses.map((r) => r.verdict.appeal.aesthetics)),
      1
    ),
    volatility: round(avg(responses.map((r) => r.verdict.sentiment.volatility))),
    currency: dominantCurrency(responses),
    vanWestendorp: {
      tooCheap: round(median(responses.map((r) => r.verdict.price.tooCheap))),
      cheap: round(median(responses.map((r) => r.verdict.price.cheap))),
      expensive: round(median(responses.map((r) => r.verdict.price.expensive))),
      tooExpensive: round(
        median(responses.map((r) => r.verdict.price.tooExpensive))
      ),
    },
    wtpMin: round(median(responses.map((r) => r.verdict.price.wtpMin))),
    wtpMax: round(median(responses.map((r) => r.verdict.price.wtpMax))),
  }
}

export type EmotionDatum = { key: EmotionKey; label: string; value: number }

export function emotionDistribution(responses: PanelResponse[]): EmotionDatum[] {
  return EMOTION_KEYS.map((key) => ({
    key,
    label: EMOTION_LABELS[key],
    value: round(avg(responses.map((r) => r.verdict.sentiment.emotions[key]))),
  }))
}

export type IntentDatum = {
  tier: IntentTier
  label: string
  count: number
  pct: number
}

export function intentDistribution(responses: PanelResponse[]): IntentDatum[] {
  const total = responses.length || 1
  return INTENT_TIERS.map((tier) => {
    const count = responses.filter((r) => r.verdict.intent.tier === tier).length
    return { tier, label: INTENT_LABELS[tier], count, pct: round((count / total) * 100) }
  })
}

export type TimingDatum = { timing: Timing; label: string; count: number }
export function timingDistribution(responses: PanelResponse[]): TimingDatum[] {
  return TIMINGS.map((timing) => ({
    timing,
    label: TIMING_LABELS[timing],
    count: responses.filter((r) => r.verdict.intent.timing === timing).length,
  }))
}

export type ClassDatum = { value: ValueClass; label: string; count: number }
export function valueClassDistribution(responses: PanelResponse[]): ClassDatum[] {
  return VALUE_CLASSES.map((value) => ({
    value,
    label: VALUE_CLASS_LABELS[value],
    count: responses.filter((r) => r.verdict.appeal.classification === value)
      .length,
  }))
}

export type ModelDatum = { model: PricingModel; label: string; count: number }
export function pricingModelDistribution(
  responses: PanelResponse[]
): ModelDatum[] {
  return PRICING_MODELS.map((model) => ({
    model,
    label: PRICING_MODEL_LABELS[model],
    count: responses.filter((r) => r.verdict.price.model === model).length,
  }))
}

export type TagDatum = { label: string; count: number }

function tallyTags(values: string[]): TagDatum[] {
  const map = new Map<string, { label: string; count: number }>()
  for (const raw of values) {
    const label = raw.trim()
    if (!label) continue
    const key = label.toLowerCase()
    const existing = map.get(key)
    if (existing) existing.count += 1
    else map.set(key, { label, count: 1 })
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

export function topFrictions(responses: PanelResponse[]): TagDatum[] {
  return tallyTags(responses.flatMap((r) => r.verdict.intent.frictions))
}

export function topRisks(responses: PanelResponse[]): TagDatum[] {
  return tallyTags(responses.flatMap((r) => r.verdict.trust.risks))
}

export type FeatureDatum = { name: string; score: number; mentions: number }

export function featureAppeal(responses: PanelResponse[]): FeatureDatum[] {
  const map = new Map<
    string,
    { name: string; total: number; mentions: number }
  >()
  for (const r of responses) {
    for (const f of r.verdict.appeal.features) {
      const key = f.name.trim().toLowerCase()
      if (!key) continue
      const existing = map.get(key)
      if (existing) {
        existing.total += f.score
        existing.mentions += 1
      } else {
        map.set(key, { name: f.name.trim(), total: f.score, mentions: 1 })
      }
    }
  }
  return [...map.values()]
    .map((f) => ({
      name: f.name,
      score: round(f.total / f.mentions, 1),
      mentions: f.mentions,
    }))
    .sort((a, b) => b.score - a.score)
}

export type LinkedQuote = {
  text: string
  topic: string
  sentiment: "positive" | "neutral" | "negative"
  metric: string
  personaName: string
  personaArchetype: string
  personaId: string
}

export function quotesForMetric(
  responses: PanelResponse[],
  metric: "sentiment" | "appeal" | "price" | "intent" | "trust"
): LinkedQuote[] {
  const out: LinkedQuote[] = []
  for (const r of responses) {
    for (const q of r.verdict.quotes) {
      if (q.metric === metric) {
        out.push({
          ...q,
          personaName: r.persona.name,
          personaArchetype: r.persona.archetype,
          personaId: r.persona.id,
        })
      }
    }
  }
  return out
}

/* ------------------------------ Cohorts ------------------------------ */

export type CohortMetrics = {
  cohort: Cohort
  count: number
  netSentiment: number
  intentIndex: number
  avgTrust: number
  wtpMax: number
  aesthetics: number
  topEmotion: string
}

export function cohortComparison(responses: PanelResponse[]): CohortMetrics[] {
  const groups = new Map<Cohort, PanelResponse[]>()
  for (const r of responses) {
    const list = groups.get(r.persona.cohort) ?? []
    list.push(r)
    groups.set(r.persona.cohort, list)
  }
  return [...groups.entries()]
    .map(([cohort, list]) => {
      const emotions = emotionDistribution(list)
      const topEmotion = [...emotions].sort((a, b) => b.value - a.value)[0]
      return {
        cohort,
        count: list.length,
        netSentiment: round(avg(list.map((r) => r.verdict.sentiment.net))),
        intentIndex: round(
          avg(list.map((r) => INTENT_WEIGHT[r.verdict.intent.tier]))
        ),
        avgTrust: round(avg(list.map((r) => r.verdict.trust.score)), 1),
        wtpMax: round(median(list.map((r) => r.verdict.price.wtpMax))),
        aesthetics: round(avg(list.map((r) => r.verdict.appeal.aesthetics)), 1),
        topEmotion: topEmotion?.label ?? "—",
      }
    })
    .sort((a, b) => b.netSentiment - a.netSentiment)
}

/* ------------------------------------------------------------------ *
 * Design panel aggregation
 * ------------------------------------------------------------------ */

export type DesignResponse = PanelResponse<DesignVerdict>

export type DesignOverview = {
  panelSize: number
  craftScore: number
  scores: Record<DesignScoreKey, number>
}

export function buildDesignOverview(responses: DesignResponse[]): DesignOverview {
  const scores = Object.fromEntries(
    DESIGN_SCORE_KEYS.map((k) => [
      k,
      round(avg(responses.map((r) => r.verdict.scores[k])), 1),
    ])
  ) as Record<DesignScoreKey, number>
  const craftScore = round(
    avg(DESIGN_SCORE_KEYS.map((k) => scores[k])),
    1
  )
  return { panelSize: responses.length, craftScore, scores }
}

export type IssueDatum = {
  title: string
  severity: Severity
  count: number
  detail: string
  by: string[]
}

export function designIssues(responses: DesignResponse[]): IssueDatum[] {
  const map = new Map<string, IssueDatum>()
  for (const r of responses) {
    for (const issue of r.verdict.issues) {
      const title = issue.title.trim()
      if (!title) continue
      const key = title.toLowerCase()
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
        if (SEVERITY_RANK[issue.severity] < SEVERITY_RANK[existing.severity]) {
          existing.severity = issue.severity
          existing.detail = issue.detail
        }
        if (!existing.by.includes(r.persona.name)) existing.by.push(r.persona.name)
      } else {
        map.set(key, {
          title,
          severity: issue.severity,
          count: 1,
          detail: issue.detail,
          by: [r.persona.name],
        })
      }
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.count - a.count
  )
}

export function designStrengths(responses: DesignResponse[]): TagDatum[] {
  return tallyTags(responses.flatMap((r) => r.verdict.strengths))
}

/* ------------------------------------------------------------------ *
 * Startup panel aggregation
 * ------------------------------------------------------------------ */

export type StartupResponse = PanelResponse<StartupVerdict>

export type StartupOverview = {
  panelSize: number
  scores: Record<StartupScoreKey, number>
  avgScore: number
  verdictLabel: string
  conviction: string
  tone: "positive" | "warning" | "negative"
}

export function buildStartupOverview(
  responses: StartupResponse[]
): StartupOverview {
  const scores = Object.fromEntries(
    STARTUP_SCORE_KEYS.map((k) => [
      k,
      round(avg(responses.map((r) => r.verdict.scores[k])), 1),
    ])
  ) as Record<StartupScoreKey, number>
  const avgScore = round(avg(STARTUP_SCORE_KEYS.map((k) => scores[k])), 1)

  let verdictLabel: string
  let tone: StartupOverview["tone"]
  if (avgScore >= 7.5) {
    verdictLabel = "Strong invest"
    tone = "positive"
  } else if (avgScore >= 6.5) {
    verdictLabel = "Invest"
    tone = "positive"
  } else if (avgScore >= 5.5) {
    verdictLabel = "Lean invest"
    tone = "warning"
  } else if (avgScore >= 4.5) {
    verdictLabel = "Caution"
    tone = "warning"
  } else {
    verdictLabel = "Pass"
    tone = "negative"
  }

  const spread =
    Math.max(...STARTUP_SCORE_KEYS.map((k) => scores[k])) -
    Math.min(...STARTUP_SCORE_KEYS.map((k) => scores[k]))
  const conviction = spread <= 2 ? "High conviction" : spread <= 4 ? "Medium conviction" : "Low conviction"

  return { panelSize: responses.length, scores, avgScore, verdictLabel, conviction, tone }
}

export type MemoPoint = { text: string; personaName: string }

function collectPoints(
  responses: StartupResponse[],
  pick: (v: StartupVerdict) => string[],
  limit = 6
): MemoPoint[] {
  const out: MemoPoint[] = []
  for (const r of responses) {
    for (const text of pick(r.verdict)) {
      const t = text.trim()
      if (t) out.push({ text: t, personaName: r.persona.name })
    }
  }
  return out.slice(0, limit)
}

export function startupBull(responses: StartupResponse[]): MemoPoint[] {
  return collectPoints(responses, (v) => v.bull)
}

export function startupBear(responses: StartupResponse[]): MemoPoint[] {
  return collectPoints(responses, (v) => v.bear)
}

export function startupRisks(responses: StartupResponse[]): TagDatum[] {
  return tallyTags(responses.flatMap((r) => r.verdict.risks))
}

/** Investor verdict → tone for the per-expert tag. */
export function investTone(
  verdict: InvestVerdict
): "positive" | "warning" | "negative" | "muted" {
  switch (verdict) {
    case "invest":
      return "positive"
    case "lean_invest":
      return "positive"
    case "caution":
      return "warning"
    case "pass":
      return "negative"
    default:
      return "muted"
  }
}
