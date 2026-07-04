"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import type { EmotionKey } from "@/lib/analysis"
import { EMOTION_LABELS } from "@/lib/analysis"

const chartConfig: ChartConfig = {
  value: { label: "Share", color: "var(--chart-1)" },
}

export function EmotionChart({ distribution }: { distribution: Record<EmotionKey, number> }) {
  const data = (Object.keys(EMOTION_LABELS) as EmotionKey[])
    .map((key) => ({
      emotion: EMOTION_LABELS[key],
      value: Math.round(distribution[key] ?? 0),
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emotional Distribution</CardTitle>
        <CardDescription>Core emotions detected across the panel</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 12, right: 16 }}>
            <XAxis type="number" dataKey="value" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="emotion"
              tickLine={false}
              axisLine={false}
              width={88}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
