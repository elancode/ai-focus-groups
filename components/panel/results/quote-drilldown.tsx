"use client"

import { Quote } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { PersonaAvatar } from "@/components/panel/persona-avatar"
import { cn } from "@/lib/utils"
import { sentimentBadge } from "@/lib/format"
import type { LinkedQuote } from "@/lib/aggregate"

export type DrilldownMetric = "sentiment" | "appeal" | "price" | "intent" | "trust"

const METRIC_LABEL: Record<DrilldownMetric, string> = {
  sentiment: "Sentiment",
  appeal: "Appeal & Desirability",
  price: "Price Perception",
  intent: "Purchase Intent",
  trust: "Trust & Credibility",
}

export function QuoteDrilldown({
  metric,
  quotes,
  onOpenChange,
}: {
  metric: DrilldownMetric | null
  quotes: LinkedQuote[]
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={metric !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{metric ? METRIC_LABEL[metric] : ""} — Evidence</SheetTitle>
          <SheetDescription>
            The verbatim panel quotes that drove this score.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100svh-5rem)] px-4 pb-6">
          <div className="flex flex-col gap-3">
            {quotes.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No linked quotes for this metric.
              </p>
            ) : (
              quotes.map((q, i) => {
                const badge = sentimentBadge[q.sentiment]
                return (
                  <figure key={i} className="rounded-lg border bg-card p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PersonaAvatar name={q.personaName} seed={q.personaId} className="size-7" />
                        <div className="leading-tight">
                          <figcaption className="text-sm font-medium">{q.personaName}</figcaption>
                          <p className="text-xs text-muted-foreground">{q.personaArchetype}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("shrink-0", badge.className)}>
                        {badge.label}
                      </Badge>
                    </div>
                    <blockquote className="flex gap-2 text-sm">
                      <Quote className="size-4 shrink-0 text-muted-foreground/50" aria-hidden />
                      <span className="text-pretty italic">{q.text}</span>
                    </blockquote>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">{q.topic}</Badge>
                    </div>
                  </figure>
                )
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
