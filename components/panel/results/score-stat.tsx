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
  companion,
}: {
  kicker: string
  headline: string
  subline?: string
  chip: ReactNode
  /** Optional left-column artifact (the analyzed-page companion, URL studies only). */
  companion?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
      {companion}
      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
    </div>
  )
}

/**
 * The analyzed page shown as a captured artifact in a small browser-chrome
 * frame. Height-capped with a fade so a tall full-page capture crops
 * gracefully. Display-only; renders nothing for text-input studies.
 */
export function AnalyzedPageCompanion({
  screenshot,
  source,
}: {
  screenshot?: string
  source?: string
}) {
  if (!screenshot) return null

  let host = source ?? ""
  try {
    host = new URL(
      /^https?:\/\//i.test(source ?? "") ? (source as string) : `https://${source}`
    ).host
  } catch {
    /* keep raw source */
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[196px]">
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-2.5 py-1.5">
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-negative/50" />
            <span className="size-2 rounded-full bg-warning/60" />
            <span className="size-2 rounded-full bg-positive/50" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
            {host}
          </span>
        </div>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot}
            alt="Screenshot of the analyzed page"
            className="h-[200px] w-full object-cover object-top"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-card" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Analyzed page · reviewed in full
      </p>
    </div>
  )
}
