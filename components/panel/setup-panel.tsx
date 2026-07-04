"use client"

import { useState } from "react"
import { CheckIcon, LinkIcon, TypeIcon, XIcon, History } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { colorIndex } from "@/lib/format"
import { PANELS, PANEL_ORDER, type PanelMeta } from "@/lib/panels"
import type { AnalysisMode, PanelId, Persona } from "@/lib/types"
import { PersonaAvatar } from "./persona-avatar"
import { CustomPersonaSheet } from "./custom-persona-sheet"

const ACCENT: Record<number, string> = {
  1: "bg-chart-1",
  2: "bg-chart-2",
  3: "bg-chart-3",
  4: "bg-chart-4",
  5: "bg-chart-5",
}

function PersonaSelectCard({
  persona,
  selected,
  onToggle,
  onRemove,
}: {
  persona: Persona
  selected: boolean
  onToggle: () => void
  onRemove?: () => void
}) {
  const accent = ACCENT[colorIndex(persona.id)]
  const subtitle = persona.subtitle ?? `${persona.age} · ${persona.occupation}`
  const specialty = persona.specialty ?? persona.archetype
  const tag = persona.tag ?? persona.cohort

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-center gap-2 overflow-hidden rounded-[14px] border bg-card px-3 pb-3.5 pt-4 text-center transition-colors",
        "hover:border-primary/40 hover:bg-accent/40",
        selected
          ? "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/30"
          : "border-border"
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-[3px]", accent)} />

      {persona.custom && onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${persona.name}`}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }
          }}
          className="absolute left-2 top-2 flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-negative/40 hover:text-negative"
        >
          <XIcon className="size-3" />
        </span>
      )}

      <span
        className={cn(
          "absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-transparent"
        )}
      >
        <CheckIcon className="size-3" />
      </span>

      <PersonaAvatar
        name={persona.name}
        seed={persona.id}
        className="size-[52px] text-sm"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{persona.name}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <p className="line-clamp-2 text-[12.5px] font-medium text-primary/90">
        {specialty}
      </p>
      <div className="mt-auto flex flex-wrap justify-center gap-1 pt-1">
        <Badge variant="secondary" className="font-normal">
          {tag}
        </Badge>
        {persona.custom && (
          <Badge className="border-chart-2/25 bg-chart-2/15 font-normal text-chart-2">
            Custom
          </Badge>
        )}
      </div>
    </button>
  )
}

function PanelChooserCard({
  meta,
  active,
  onSelect,
}: {
  meta: PanelMeta
  active: boolean
  onSelect: () => void
}) {
  const Icon = meta.icon
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border bg-card p-4 text-left transition-colors",
        "hover:border-primary/40 hover:bg-accent/40",
        active
          ? "border-primary/55 bg-primary/[0.05] ring-1 ring-primary/30"
          : "border-border"
      )}
    >
      {active && (
        <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-3" />
        </span>
      )}
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-lg transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">{meta.cardTitle}</p>
        <p className="text-pretty text-sm text-muted-foreground">
          {meta.tagline}
        </p>
      </div>
      <p className="mt-auto font-mono text-xs text-muted-foreground">
        {meta.personas.length} {meta.memberNoun}
      </p>
    </button>
  )
}

export function SetupPanel({
  activePanel,
  onSetPanel,
  personas,
  selectedIds,
  onToggle,
  onSelectAll,
  onAddCustom,
  onRemoveCustom,
  onRun,
  historyCount,
  onOpenHistory,
}: {
  activePanel: PanelId
  onSetPanel: (panel: PanelId) => void
  personas: Persona[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: (all: boolean) => void
  onAddCustom: (p: Persona) => void
  onRemoveCustom: (id: string) => void
  onRun: (input: { mode: AnalysisMode; source: string }) => void
  historyCount: number
  onOpenHistory: () => void
}) {
  const [mode, setMode] = useState<AnalysisMode>("url")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")

  const meta = PANELS[activePanel]
  const source = mode === "text" ? text : url
  const canRun = source.trim().length > 0 && selectedIds.length > 0
  const allSelected =
    personas.length > 0 && selectedIds.length === personas.length

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-14">
      {historyCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onOpenHistory}>
            <History data-icon="inline-start" />
            History
            <span className="ml-1 rounded-full bg-secondary px-1.5 font-mono text-xs">
              {historyCount}
            </span>
          </Button>
        </div>
      )}

      <header className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Put your idea in front of <span className="text-primary">a panel</span>
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground md:text-lg">
          Paste a concept, ad, or landing page, then pick a panel — everyday
          consumers, working designers, or startup operators — and get honest,
          in-character feedback in seconds.
        </p>
      </header>

      {/* -------------------------- Choose your panel -------------------------- */}
      <section className="flex flex-col gap-3">
        <p className="text-sm font-medium">Choose your panel</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PANEL_ORDER.map((id) => (
            <PanelChooserCard
              key={id}
              meta={PANELS[id]}
              active={id === activePanel}
              onSelect={() => onSetPanel(id)}
            />
          ))}
        </div>
      </section>

      {/* -------------------------- Input console -------------------------- */}
      <Card className="overflow-hidden shadow-lg shadow-primary/5">
        <CardContent className="flex flex-col gap-4 p-4 md:p-6">
          <Tabs value={mode} onValueChange={(v) => setMode(v as AnalysisMode)}>
            <div className="flex items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="url">
                  <LinkIcon data-icon="inline-start" />
                  From URL
                </TabsTrigger>
                <TabsTrigger value="text">
                  <TypeIcon data-icon="inline-start" />
                  Paste text
                </TabsTrigger>
              </TabsList>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Concept · Ad · Speech · Landing page
              </span>
            </div>

            <TabsContent value="url" className="mt-4">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-landing-page.com/product"
                className="text-base"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                We&apos;ll fetch the page and extract its readable text to
                analyze.
              </p>
            </TabsContent>
            <TabsContent value="text" className="mt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="e.g. Introducing Aura — a $29/mo AI sleep coach that listens overnight and builds a personalized wind-down routine..."
                className="resize-none text-base"
              />
            </TabsContent>
          </Tabs>

          <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Analyzing with{" "}
              <span className="font-medium text-foreground">
                {selectedIds.length}
              </span>{" "}
              selected {meta.memberNoun}
            </p>
            <Button
              size="lg"
              disabled={!canRun}
              onClick={() => onRun({ mode, source })}
              className="w-full sm:w-auto"
            >
              <meta.icon data-icon="inline-start" />
              {meta.ctaLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* -------------------------- Panel members -------------------------- */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold">Panel members</h2>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {selectedIds.length} of {personas.length}
              </span>{" "}
              selected · {meta.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectAll(!allSelected)}
            >
              {allSelected ? "Clear all" : "Select all"}
            </Button>
            <CustomPersonaSheet onAdd={onAddCustom} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {personas.map((p) => (
            <PersonaSelectCard
              key={p.id}
              persona={p}
              selected={selectedIds.includes(p.id)}
              onToggle={() => onToggle(p.id)}
              onRemove={p.custom ? () => onRemoveCustom(p.id) : undefined}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
