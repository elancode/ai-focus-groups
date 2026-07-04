"use client"

import { Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { IntentDatum } from "@/lib/aggregate"

const TIER_COLOR: Record<string, string> = {
  definitely: "var(--chart-4)",
  probably: "var(--chart-2)",
  maybe: "var(--chart-3)",
  probably_not: "var(--chart-5)",
  definitely_not: "var(--destructive)",
}

const chartConfig: ChartConfig = { count: { label: "Panelists" } }

export function IntentChart({ data }: { data: IntentDatum[] }) {
  const active = data.filter((d) => d.count > 0)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Intent</CardTitle>
        <CardDescription>Distribution across standard intent tiers</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row">
        <ChartContainer config={chartConfig} className="aspect-square h-48">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
            <Pie data={active} dataKey="count" nameKey="label" innerRadius={44} strokeWidth={2}>
              {active.map((d) => (
                <Cell key={d.tier} fill={TIER_COLOR[d.tier]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="flex flex-1 flex-col gap-2">
          {data.map((d) => (
            <li key={d.tier} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: TIER_COLOR[d.tier] }}
                aria-hidden
              />
              <span className="flex-1 text-muted-foreground">{d.label}</span>
              <span className="font-medium tabular-nums">{d.pct}%</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
