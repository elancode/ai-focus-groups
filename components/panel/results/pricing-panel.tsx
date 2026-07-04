"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Overview } from "@/lib/aggregate"
import { formatMoney } from "@/lib/format"

type Band = { key: keyof Overview["vanWestendorp"]; label: string; hint: string; color: string }

const BANDS: Band[] = [
  { key: "tooCheap", label: "Too Cheap", hint: "Suspicious quality", color: "var(--chart-5)" },
  { key: "cheap", label: "Bargain", hint: "Good value", color: "var(--chart-4)" },
  { key: "expensive", label: "Premium", hint: "Acceptable", color: "var(--chart-3)" },
  { key: "tooExpensive", label: "Too Expensive", hint: "Dealbreaker", color: "var(--destructive)" },
]

export function PricingPanel({ overview }: { overview: Overview }) {
  const { vanWestendorp: vw, currency, wtpMin, wtpMax } = overview
  const max = Math.max(vw.tooExpensive, wtpMax, 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Perception & Elasticity</CardTitle>
        <CardDescription>Van Westendorp price bands (panel medians)</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          {BANDS.map((b) => {
            const value = vw[b.key]
            return (
              <div key={b.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium">{b.label}</span>
                  <span className="tabular-nums font-semibold">{formatMoney(value, currency)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: b.color }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{b.hint}</span>
              </div>
            )
          })}
        </div>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Willingness to Pay
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {formatMoney(wtpMin, currency)} – {formatMoney(wtpMax, currency)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Median budget range across the panel
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
