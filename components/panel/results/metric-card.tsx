"use client"

import type { LucideIcon } from "lucide-react"
import { QuoteIcon } from "lucide-react"

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type MetricKey = "sentiment" | "appeal" | "price" | "intent" | "trust"

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
  quoteCount,
  onClick,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon: LucideIcon
  tone?: "default" | "positive" | "negative" | "warning" | "primary"
  quoteCount?: number
  onClick?: () => void
}) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-positive",
    negative: "text-negative",
    warning: "text-warning",
    primary: "text-primary",
  }[tone]

  const interactive = Boolean(onClick)

  return (
    <Card
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (interactive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        "group flex flex-col gap-3 p-4 transition-colors",
        interactive &&
          "cursor-pointer hover:border-primary/40 hover:bg-accent/30"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </span>
        {quoteCount != null && quoteCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <QuoteIcon className="size-3" />
            {quoteCount}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "font-mono text-3xl font-semibold tracking-tight tabular-nums",
            toneClass
          )}
        >
          {value}
        </span>
        {sub && (
          <span className="text-xs text-muted-foreground">{sub}</span>
        )}
      </div>
    </Card>
  )
}
