"use client"

import { useMemo, useState } from "react"
import { Gauge, Heart, Sparkles, Tag, ShieldCheck } from "lucide-react"

import { MetricCard, type MetricKey } from "./metric-card"
import { EmotionChart } from "./emotion-chart"
import { IntentChart } from "./intent-chart"
import { PricingPanel } from "./pricing-panel"
import { FeatureAppealCard, FrictionCard, RiskCard } from "./insight-lists"
import { CohortMatrix } from "./cohort-matrix"
import { PersonaVerdictCard } from "./persona-verdict-card"
import { QuoteDrilldown, type DrilldownMetric } from "./quote-drilldown"
import { ResultsHeader, VerdictChip, type Tone } from "./score-stat"
import {
  buildOverview,
  cohortComparison,
  emotionDistribution,
  featureAppeal,
  intentDistribution,
  quotesForMetric,
  topFrictions,
  topRisks,
} from "@/lib/aggregate"
import { netToneLabel } from "@/lib/format"
import type { PanelResponse, Session } from "@/lib/types"

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-muted-foreground">{children}</h3>
  )
}

export function ConsumerResults({ session }: { session: Session }) {
  const responses = session.responses as PanelResponse[]
  const [drill, setDrill] = useState<DrilldownMetric | null>(null)

  const data = useMemo(
    () => ({
      overview: buildOverview(responses),
      emotions: emotionDistribution(responses),
      intent: intentDistribution(responses),
      features: featureAppeal(responses).slice(0, 8),
      frictions: topFrictions(responses).slice(0, 8),
      risks: topRisks(responses).slice(0, 8),
      cohorts: cohortComparison(responses),
    }),
    [responses]
  )

  const drillQuotes = useMemo(
    () => (drill ? quotesForMetric(responses, drill) : []),
    [drill, responses]
  )

  const quoteCounts = useMemo(() => {
    const metrics: MetricKey[] = [
      "sentiment",
      "appeal",
      "price",
      "intent",
      "trust",
    ]
    const out = {} as Record<MetricKey, number>
    for (const m of metrics) out[m] = quotesForMetric(responses, m).length
    return out
  }, [responses])

  const o = data.overview
  const tone: Tone =
    o.netSentiment >= 25 ? "positive" : o.netSentiment <= -25 ? "negative" : "warning"

  return (
    <div className="flex flex-col gap-6">
      <ResultsHeader
        kicker={`Consumer panel · ${o.panelSize} personas`}
        headline={`${netToneLabel(o.netSentiment)} read — net sentiment ${o.netSentiment > 0 ? "+" : ""}${o.netSentiment}, ${o.intentIndex}/100 purchase intent.`}
        subline="Tap any metric card to see the exact panel quotes behind the score."
        chip={
          <VerdictChip
            label="Net sentiment"
            value={`${o.netSentiment > 0 ? "+" : ""}${o.netSentiment}`}
            sub={netToneLabel(o.netSentiment)}
            tone={tone}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard
          label="Net Sentiment"
          value={`${o.netSentiment > 0 ? "+" : ""}${o.netSentiment}`}
          sub={netToneLabel(o.netSentiment)}
          icon={Heart}
          tone={tone}
          quoteCount={quoteCounts.sentiment}
          onClick={() => setDrill("sentiment")}
        />
        <MetricCard
          label="Purchase Intent"
          value={o.intentIndex}
          sub="0-100 index"
          icon={Gauge}
          tone="primary"
          quoteCount={quoteCounts.intent}
          onClick={() => setDrill("intent")}
        />
        <MetricCard
          label="Appeal"
          value={o.avgAesthetics.toFixed(1)}
          sub="Aesthetics / 10"
          icon={Sparkles}
          quoteCount={quoteCounts.appeal}
          onClick={() => setDrill("appeal")}
        />
        <MetricCard
          label="Median WTP"
          value={`${o.currency === "USD" ? "$" : o.currency}${o.wtpMax}`}
          sub="Max willingness"
          icon={Tag}
          quoteCount={quoteCounts.price}
          onClick={() => setDrill("price")}
        />
        <MetricCard
          label="Trust"
          value={`${o.avgTrust}`}
          sub="of 5.0"
          icon={ShieldCheck}
          tone={o.avgTrust >= 3.5 ? "positive" : o.avgTrust < 2.5 ? "negative" : "warning"}
          quoteCount={quoteCounts.trust}
          onClick={() => setDrill("trust")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <EmotionChart
          distribution={
            Object.fromEntries(
              data.emotions.map((e) => [e.key, e.value])
            ) as never
          }
        />
        <IntentChart data={data.intent} />
        <PricingPanel overview={o} />
        <FeatureAppealCard features={data.features} />
        <FrictionCard frictions={data.frictions} />
        <RiskCard risks={data.risks} />
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>Cohort comparison</SectionTitle>
        <CohortMatrix cohorts={data.cohorts} currency={o.currency} />
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Panelist verdicts</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {responses.map((r) => (
            <PersonaVerdictCard key={r.persona.id} response={r} />
          ))}
        </div>
      </section>

      <QuoteDrilldown
        metric={drill}
        quotes={drillQuotes}
        onOpenChange={(open) => !open && setDrill(null)}
      />
    </div>
  )
}
