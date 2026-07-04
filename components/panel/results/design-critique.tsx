"use client"

import { useMemo } from "react"
import { Check, Quote } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PersonaAvatar } from "../persona-avatar"
import {
  ResultsHeader,
  ScoreStat,
  VerdictChip,
  toneForScore,
} from "./score-stat"
import {
  buildDesignOverview,
  designIssues,
  designStrengths,
  type DesignResponse,
} from "@/lib/aggregate"
import {
  DESIGN_SCORE_KEYS,
  DESIGN_SCORE_LABELS,
  SEVERITY_LABELS,
  type Severity,
} from "@/lib/analysis"
import type { Session } from "@/lib/types"

const SEVERITY_CLASS: Record<Severity, string> = {
  critical: "bg-negative/12 text-negative border-negative/25",
  major: "bg-warning/15 text-warning border-warning/30",
  minor: "bg-secondary text-muted-foreground border-border",
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-muted-foreground">{children}</h3>
  )
}

export function DesignCritique({ session }: { session: Session }) {
  const responses = session.responses as DesignResponse[]
  const o = useMemo(() => buildDesignOverview(responses), [responses])
  const issues = useMemo(() => designIssues(responses), [responses])
  const strengths = useMemo(() => designStrengths(responses), [responses])

  return (
    <div className="flex flex-col gap-6">
      <ResultsHeader
        kicker={`Design panel · ${o.panelSize} designers`}
        headline={`Craft lands at ${o.craftScore}/10 — ${o.craftScore >= 7 ? "solid work with room to sharpen" : o.craftScore >= 5 ? "a mixed review with real gaps" : "significant craft problems to address"}.`}
        subline="Severity-ranked issues, strengths, and each designer's critique."
        chip={
          <VerdictChip
            label="Craft score"
            value={o.craftScore}
            sub="of 10"
            tone={toneForScore(o.craftScore)}
          />
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {DESIGN_SCORE_KEYS.map((k) => (
          <ScoreStat
            key={k}
            label={DESIGN_SCORE_LABELS[k]}
            value={o.scores[k].toFixed(1)}
            sub="of 10"
            tone={toneForScore(o.scores[k])}
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <SectionTitle>Issues found</SectionTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {issues.length === 0 && (
              <p className="text-sm text-muted-foreground">No issues flagged.</p>
            )}
            {issues.map((issue, i) => (
              <div key={i} className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", SEVERITY_CLASS[issue.severity])}
                  >
                    {SEVERITY_LABELS[issue.severity]}
                  </Badge>
                  <span className="text-sm font-medium">{issue.title}</span>
                </div>
                <p className="text-sm text-muted-foreground">{issue.detail}</p>
                <p className="text-xs text-muted-foreground/80">
                  Flagged by {issue.by.join(", ")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SectionTitle>What&apos;s working</SectionTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2.5">
            {strengths.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No standout strengths noted.
              </p>
            )}
            {strengths.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-positive" />
                <span>
                  {s.label}
                  {s.count > 1 && (
                    <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                      ×{s.count}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>Designer critiques</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {responses.map((r) => {
            const scores = DESIGN_SCORE_KEYS.map((k) => r.verdict.scores[k])
            const avg =
              Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) /
              10
            return (
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
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-mono text-lg font-bold tabular-nums",
                          toneForScore(avg) === "positive"
                            ? "text-positive"
                            : toneForScore(avg) === "warning"
                              ? "text-warning"
                              : "text-negative"
                        )}
                      >
                        {avg.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.persona.tag}
                      </p>
                    </div>
                  </div>
                  <p className="text-pretty text-sm font-medium">
                    &ldquo;{r.verdict.headline}&rdquo;
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <p className="text-pretty text-sm text-muted-foreground">
                    {r.verdict.summary}
                  </p>
                  {r.verdict.quotes[0] && (
                    <blockquote className="flex gap-1.5 rounded-md border bg-muted/40 p-3 text-sm italic">
                      <Quote
                        className="size-3.5 shrink-0 text-muted-foreground/50"
                        aria-hidden
                      />
                      {r.verdict.quotes[0].text}
                    </blockquote>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
