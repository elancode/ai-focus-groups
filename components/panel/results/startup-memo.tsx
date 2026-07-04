"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Quote, AlertTriangle } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { PersonaAvatar } from "../persona-avatar"
import {
  ResultsHeader,
  ScoreStat,
  VerdictChip,
  toneForScore,
  type Tone,
} from "./score-stat"
import {
  buildStartupOverview,
  investTone,
  startupBear,
  startupBull,
  startupRisks,
  type StartupResponse,
} from "@/lib/aggregate"
import {
  INVEST_LABELS,
  STARTUP_SCORE_KEYS,
  STARTUP_SCORE_LABELS,
} from "@/lib/analysis"
import type { Session } from "@/lib/types"

const INVEST_CLASS: Record<
  ReturnType<typeof investTone>,
  string
> = {
  positive: "bg-positive/12 text-positive border-positive/25",
  warning: "bg-warning/15 text-warning border-warning/30",
  negative: "bg-negative/12 text-negative border-negative/25",
  muted: "bg-secondary text-muted-foreground border-border",
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-muted-foreground">{children}</h3>
  )
}

export function StartupMemo({ session }: { session: Session }) {
  const responses = session.responses as StartupResponse[]
  const o = useMemo(() => buildStartupOverview(responses), [responses])
  const bull = useMemo(() => startupBull(responses), [responses])
  const bear = useMemo(() => startupBear(responses), [responses])
  const risks = useMemo(() => startupRisks(responses), [responses])

  return (
    <div className="flex flex-col gap-6">
      <ResultsHeader
        kicker={`Startup panel · ${o.panelSize} experts`}
        headline={`The panel leans "${o.verdictLabel}" — ${o.conviction.toLowerCase()}, averaging ${o.avgScore}/10 across the board.`}
        subline="The bull and bear cases, key risks to diligence, and each expert's memo."
        chip={
          <VerdictChip
            label="Panel verdict"
            value={o.verdictLabel}
            sub={o.conviction}
            tone={o.tone as Tone}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {STARTUP_SCORE_KEYS.map((k) => (
          <ScoreStat
            key={k}
            label={STARTUP_SCORE_LABELS[k]}
            value={o.scores[k].toFixed(1)}
            sub="of 10"
            tone={toneForScore(o.scores[k])}
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-positive">
              <TrendingUp className="size-4" />
              The bull case
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {bull.map((p, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-positive" />
                <span>{p}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-negative">
              <TrendingDown className="size-4" />
              The bear case
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {bear.map((p, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-negative" />
                <span>{p}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {risks.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Key risks to diligence</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {risks.map((r, i) => (
              <Badge
                key={i}
                variant="outline"
                className="gap-1.5 border-warning/30 bg-warning/10 py-1 font-normal text-warning"
              >
                <AlertTriangle className="size-3.5" />
                {r.label}
                {r.count > 1 && (
                  <span className="font-mono text-xs opacity-70">×{r.count}</span>
                )}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionTitle>Expert takes</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {responses.map((r) => (
            <Card key={r.persona.id} className="overflow-hidden">
              <CardHeader className="gap-3">
                <div className="flex items-start gap-3">
                  <PersonaAvatar
                    name={r.persona.name}
                    seed={r.persona.id}
                    className="size-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.persona.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {r.persona.subtitle ?? r.persona.specialty}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-xs",
                      INVEST_CLASS[investTone(r.verdict.verdict)]
                    )}
                  >
                    {INVEST_LABELS[r.verdict.verdict]}
                  </Badge>
                </div>
                <p className="text-pretty text-sm font-medium">
                  &ldquo;{r.verdict.headline}&rdquo;
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <p className="text-pretty text-sm text-muted-foreground">
                  {r.verdict.summary}
                </p>
                <Accordion>
                  <AccordionItem value="detail">
                    <AccordionTrigger>Full memo & scores</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-3">
                      <p className="text-pretty text-sm text-muted-foreground">
                        {r.verdict.memo}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {STARTUP_SCORE_KEYS.map((k) => (
                          <Badge
                            key={k}
                            variant="outline"
                            className="gap-1 font-normal"
                          >
                            {STARTUP_SCORE_LABELS[k]}
                            <span className="font-mono tabular-nums">
                              {r.verdict.scores[k]}
                            </span>
                          </Badge>
                        ))}
                      </div>

                      {r.verdict.quotes.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {r.verdict.quotes.map((q, i) => (
                            <blockquote
                              key={i}
                              className="flex gap-1.5 rounded-md border bg-muted/40 p-3 text-sm italic"
                            >
                              <Quote
                                className="size-3.5 shrink-0 text-muted-foreground/50"
                                aria-hidden
                              />
                              {q.text}
                            </blockquote>
                          ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
