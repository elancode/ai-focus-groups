"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatMoney, netToneClass } from "@/lib/format"
import type { CohortMetrics } from "@/lib/aggregate"

function heat(value: number, min: number, max: number): string {
  if (max === min) return "0"
  return ((value - min) / (max - min)).toFixed(2)
}

export function CohortMatrix({
  cohorts,
  currency,
}: {
  cohorts: CohortMetrics[]
  currency: string
}) {
  const sentiments = cohorts.map((c) => c.netSentiment)
  const intents = cohorts.map((c) => c.intentIndex)
  const trusts = cohorts.map((c) => c.avgTrust)
  const wtps = cohorts.map((c) => c.wtpMax)

  const rows: {
    label: string
    render: (c: CohortMetrics) => React.ReactNode
    heatFrom?: number[]
    valueOf?: (c: CohortMetrics) => number
  }[] = [
    {
      label: "Net Sentiment",
      valueOf: (c) => c.netSentiment,
      heatFrom: sentiments,
      render: (c) => (
        <span className={cn("font-semibold tabular-nums", netToneClass(c.netSentiment))}>
          {c.netSentiment > 0 ? "+" : ""}
          {c.netSentiment}
        </span>
      ),
    },
    {
      label: "Intent Index",
      valueOf: (c) => c.intentIndex,
      heatFrom: intents,
      render: (c) => <span className="tabular-nums">{c.intentIndex}</span>,
    },
    {
      label: "Trust (1-5)",
      valueOf: (c) => c.avgTrust,
      heatFrom: trusts,
      render: (c) => <span className="tabular-nums">{c.avgTrust}</span>,
    },
    {
      label: "Max WTP",
      valueOf: (c) => c.wtpMax,
      heatFrom: wtps,
      render: (c) => <span className="tabular-nums">{formatMoney(c.wtpMax, currency)}</span>,
    },
    {
      label: "Top Emotion",
      render: (c) => <span className="text-muted-foreground">{c.topEmotion}</span>,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cohort Comparison</CardTitle>
        <CardDescription>How key metrics differ across generational cohorts</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium text-muted-foreground">
                Metric
              </th>
              {cohorts.map((c) => (
                <th key={c.cohort} className="px-3 py-2 text-center font-semibold">
                  {c.cohort}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">({c.count})</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const min = row.heatFrom ? Math.min(...row.heatFrom) : 0
              const max = row.heatFrom ? Math.max(...row.heatFrom) : 0
              return (
                <tr key={row.label}>
                  <td className="sticky left-0 z-10 border-t bg-card px-3 py-2.5 font-medium">
                    {row.label}
                  </td>
                  {cohorts.map((c) => {
                    const alpha =
                      row.heatFrom && row.valueOf
                        ? heat(row.valueOf(c), min, max)
                        : "0"
                    return (
                      <td
                        key={c.cohort}
                        className="border-t px-3 py-2.5 text-center"
                        style={{ backgroundColor: `color-mix(in oklab, var(--primary) ${Number(alpha) * 18}%, transparent)` }}
                      >
                        {row.render(c)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
