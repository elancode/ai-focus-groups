import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type Tone = "default" | "positive" | "warning" | "negative" | "primary"

const TONE: Record<Tone, string> = {
  default: "text-foreground",
  positive: "text-positive",
  warning: "text-warning",
  negative: "text-negative",
  primary: "text-primary",
}

/** Map a 0–max score to a tone (positive / warning / negative). */
export function toneForScore(score: number, max = 10): Tone {
  const pct = score / max
  if (pct >= 0.7) return "positive"
  if (pct >= 0.5) return "warning"
  return "negative"
}

export function ScoreStat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
}) {
  return (
    <Card className="flex flex-col gap-2 p-4">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-3xl font-semibold tracking-tight tabular-nums",
          TONE[tone]
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </Card>
  )
}

export function VerdictChip({
  label,
  value,
  sub,
  tone = "primary",
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
}) {
  return (
    <div className="flex w-fit flex-col gap-0.5 rounded-xl border bg-card px-4 py-3 sm:items-end sm:text-right">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          TONE[tone]
        )}
      >
        {value}
      </span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  )
}

export function ResultsHeader({
  kicker,
  headline,
  subline,
  chip,
}: {
  kicker: string
  headline: string
  subline?: string
  chip: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {kicker}
        </span>
        <h2 className="text-balance text-xl font-semibold tracking-tight sm:text-2xl">
          {headline}
        </h2>
        {subline && (
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
            {subline}
          </p>
        )}
      </div>
      <div className="shrink-0">{chip}</div>
    </div>
  )
}
