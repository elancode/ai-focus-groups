"use client"

import { AlertTriangle, ShieldAlert, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import type { FeatureDatum, TagDatum } from "@/lib/aggregate"

export function FeatureAppealCard({ features }: { features: FeatureDatum[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          Feature Appeal
        </CardTitle>
        <CardDescription>Average appeal (1-10) for each mentioned feature</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {features.length === 0 ? (
          <p className="text-sm text-muted-foreground">No specific features surfaced.</p>
        ) : (
          features.map((f) => (
            <div key={f.name} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{f.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {f.score.toFixed(1)}
                  <span className="ml-1 text-xs">({f.mentions})</span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(f.score / 10) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function TagCard({
  title,
  description,
  icon,
  tags,
  tone,
}: {
  title: string
  description: string
  icon: React.ReactNode
  tags: TagDatum[]
  tone: "warning" | "negative"
}) {
  const toneClass =
    tone === "negative"
      ? "bg-negative/10 text-negative border-negative/25"
      : "bg-warning/15 text-warning border-warning/30"
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">{icon}</EmptyMedia>
              <EmptyTitle>None flagged</EmptyTitle>
              <EmptyDescription>The panel raised no concerns here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Badge key={t.label} variant="outline" className={toneClass}>
                {t.label}
                <span className="ml-1.5 tabular-nums opacity-70">{t.count}</span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function FrictionCard({ frictions }: { frictions: TagDatum[] }) {
  return (
    <TagCard
      title="Adoption Friction"
      description="Barriers preventing adoption, ranked by frequency"
      icon={<AlertTriangle className="size-4 text-warning" aria-hidden />}
      tags={frictions}
      tone="warning"
    />
  )
}

export function RiskCard({ risks }: { risks: TagDatum[] }) {
  return (
    <TagCard
      title="Risk Perceptions"
      description="Specific anxieties raised by the panel"
      icon={<ShieldAlert className="size-4 text-negative" aria-hidden />}
      tags={risks}
      tone="negative"
    />
  )
}
