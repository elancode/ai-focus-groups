"use client"

import { Quote } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { PersonaAvatar } from "@/components/panel/persona-avatar"
import { cn } from "@/lib/utils"
import { netToneClass, netToneLabel, sentimentBadge } from "@/lib/format"
import { INTENT_LABELS, VALUE_CLASS_LABELS } from "@/lib/analysis"
import type { PanelResponse } from "@/lib/types"

export function PersonaVerdictCard({ response }: { response: PanelResponse }) {
  const { persona, verdict } = response
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex items-start gap-3">
          <PersonaAvatar name={persona.name} seed={persona.id} className="size-10" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">{persona.name}</p>
              {persona.custom ? <Badge variant="secondary" className="text-xs">Custom</Badge> : null}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {persona.archetype} · {persona.cohort}
            </p>
          </div>
          <div className="text-right">
            <p className={cn("text-lg font-bold tabular-nums", netToneClass(verdict.sentiment.net))}>
              {verdict.sentiment.net > 0 ? "+" : ""}
              {verdict.sentiment.net}
            </p>
            <p className="text-xs text-muted-foreground">{netToneLabel(verdict.sentiment.net)}</p>
          </div>
        </div>
        <p className="text-pretty text-sm font-medium">&ldquo;{verdict.headline}&rdquo;</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-pretty text-sm text-muted-foreground">{verdict.summary}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{INTENT_LABELS[verdict.intent.tier]}</Badge>
          <Badge variant="outline">{VALUE_CLASS_LABELS[verdict.appeal.classification]}</Badge>
          <Badge variant="outline">Trust {verdict.trust.score}/5</Badge>
        </div>

        <Accordion>
          <AccordionItem value="detail">
            <AccordionTrigger>Full reaction & quotes</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-3">
              <p className="text-pretty text-sm text-muted-foreground">{verdict.detailedFeedback}</p>
              <div className="flex flex-col gap-2">
                {verdict.quotes.map((q, i) => {
                  const badge = sentimentBadge[q.sentiment]
                  return (
                    <blockquote key={i} className="rounded-md border bg-muted/40 p-3 text-sm">
                      <div className="mb-1 flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", badge.className)}>
                          {q.topic}
                        </Badge>
                      </div>
                      <p className="flex gap-1.5 text-pretty italic">
                        <Quote className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
                        {q.text}
                      </p>
                    </blockquote>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
