"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig: ChartConfig = {
  count: { label: "Runs", color: "var(--chart-1)" },
}

export function RunsByDayChart({
  data,
}: {
  data: { date: string; count: number }[]
}) {
  const rows = data.map((d) => ({
    // "2026-07-05" → "Jul 5"
    label: new Date(`${d.date}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    count: d.count,
  }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>Runs per day</CardTitle>
        <CardDescription>Last {data.length} days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart accessibilityLayer data={rows} margin={{ left: 8, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export function SliceChart({
  title,
  description,
  data,
}: {
  title: string
  description?: string
  data: { key: string; count: number }[]
}) {
  const rows = data.map((d) => ({ key: d.key, count: d.count }))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart
              accessibilityLayer
              data={rows}
              layout="vertical"
              margin={{ left: 12, right: 16 }}
            >
              <XAxis type="number" dataKey="count" allowDecimals={false} hide />
              <YAxis
                type="category"
                dataKey="key"
                tickLine={false}
                axisLine={false}
                width={92}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
