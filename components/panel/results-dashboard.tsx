"use client"

import { useMemo, useState } from "react"
import {
  Gauge,
  Heart,
  Sparkles,
  Tag,
  ShieldCheck,
  ArrowLeft,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard, type MetricKey } from "@/components/panel/results/metric-card"
import { EmotionChart } from "@/components/panel/results/emotion-chart"
import { IntentChart } from "@/components/panel/results/intent-chart"
import { PricingPanel } from "@/components/panel/results/pricing-panel"
import {
  FeatureAppealCard,
  FrictionCard,
  RiskCard,
} from "@/components/panel/results/insight-lists"
import { CohortMatrix } from "@/components/panel/results/cohort-matrix"
import { PersonaVerdictCard } from "@/components/panel/results/persona-verdict-card"
import {
  QuoteDrilldown,
  type DrilldownMetric,
} from "@/components/panel/results/quote-drilldown"
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
import type { Session } from "@/lib/types"

export function ResultsDashboard({
  session,
  onReset,
}: {
  session: Session
  onReset: () => void
}) {
  const [drill, setDrill] = useState<DrilldownMetric | null>(null)
  const responses = session.responses

  const data = useMemo(() => {
    return {
      overview: buildOverview(responses),
      emotions: emotionDistribution(responses),
      intent: intentDistribution(responses),
      features: featureAppeal(responses),
      frictions: topFrictions(responses),
      risks: topRisks(responses),
      cohorts: cohortComparison(responses),
    }
  }, [responses])

  const drillQuotes = useMemo(
    () => (drill ? quotesForMetric(responses, drill) : []),
    [drill, responses]
  )

  const quoteCounts = useMemo(() => {
    const metrics: MetricKey[] = ["sentiment", "appeal", "price", "intent", "trust"]
    const out = {} as Record<MetricKey, number>
    for (const m of metrics) out[m] = quotesForMetric(responses, m).length
    return out
  }, [responses])

  const o = data.overview

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onReset} className="-ml-2">
              <ArrowLeft data-icon="inline-start" />
              New study
            </Button>
          </div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">{session.title}</h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            {o.panelSize} personas · {session.mode === "url" ? "URL" : "Text"} analysis
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          Net sentiment {o.netSentiment > 0 ? "+" : ""}
          {o.netSentiment} · {netToneLabel(o.netSentiment)}
        </Badge>
      </div>

      <Tabs defaultValue="panelists" className="gap-5">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="panelists">Panelists</TabsTrigger>
          <TabsTrigger value="overview">Metrics</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
        </TabsList>

        {/* -------------------------- Overview -------------------------- */}
        <TabsContent value="overview" className="flex flex-col gap-5">
          <p className="text-sm text-muted-foreground">
            Tap any metric card to see the exact panel quotes behind the score.
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <MetricCard
              label="Net Sentiment"
              value={`${o.netSentiment > 0 ? "+" : ""}${o.netSentiment}`}
              sub={netToneLabel(o.netSentiment)}
              icon={Heart}
              tone={o.netSentiment >= 25 ? "positive" : o.netSentiment <= -25 ? "negative" : "warning"}
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
            <EmotionChart distribution={Object.fromEntries(data.emotions.map((e) => [e.key, e.value])) as never} />
            <IntentChart data={data.intent} />
            <PricingPanel overview={o} />
            <FeatureAppealCard features={data.features} />
            <FrictionCard frictions={data.frictions} />
            <RiskCard risks={data.risks} />
          </div>
        </TabsContent>

        {/* -------------------------- Cohorts -------------------------- */}
        <TabsContent value="cohorts" className="flex flex-col gap-5">
          <CohortMatrix cohorts={data.cohorts} currency={o.currency} />
        </TabsContent>

        {/* -------------------------- Panelists -------------------------- */}
        <TabsContent value="panelists">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {responses.map((r) => (
              <PersonaVerdictCard key={r.persona.id} response={r} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <QuoteDrilldown
        metric={drill}
        quotes={drillQuotes}
        onOpenChange={(open) => !open && setDrill(null)}
      />
    </div>
  )
}
