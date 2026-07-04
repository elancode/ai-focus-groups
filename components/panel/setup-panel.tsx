"use client"

import { useState } from "react"
import { CheckIcon, LinkIcon, TypeIcon, UsersIcon, ZapIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { AnalysisMode, Persona } from "@/lib/types"
import { PersonaAvatar } from "./persona-avatar"
import { CustomPersonaSheet } from "./custom-persona-sheet"

function PersonaSelectCard({
  persona,
  selected,
  onToggle,
}: {
  persona: Persona
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col gap-2 rounded-xl border bg-card p-3 text-left transition-colors",
        "hover:border-primary/40 hover:bg-accent/40",
        selected
          ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
          : "border-border"
      )}
    >
      <span
        className={cn(
          "absolute right-3 top-3 flex size-5 items-center justify-center rounded-full border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-transparent"
        )}
      >
        <CheckIcon className="size-3" />
      </span>
      <div className="flex items-center gap-2.5">
        <PersonaAvatar name={persona.name} seed={persona.id} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{persona.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {persona.age} · {persona.occupation}
          </p>
        </div>
      </div>
      <p className="text-sm font-medium text-primary/90">{persona.archetype}</p>
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="font-normal">
          {persona.cohort}
        </Badge>
        {persona.traits.slice(0, 2).map((t) => (
          <Badge key={t} variant="outline" className="font-normal">
            {t}
          </Badge>
        ))}
        {persona.custom && (
          <Badge className="bg-chart-2/15 text-chart-2 border-chart-2/25 font-normal">
            Custom
          </Badge>
        )}
      </div>
    </button>
  )
}

export function SetupPanel({
  personas,
  selectedIds,
  onToggle,
  onAddCustom,
  onSelectAll,
  onRun,
}: {
  personas: Persona[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onAddCustom: (p: Persona) => void
  onSelectAll: (all: boolean) => void
  onRun: (input: { mode: AnalysisMode; source: string }) => void
}) {
  const [mode, setMode] = useState<AnalysisMode>("text")
  const [text, setText] = useState("")
  const [url, setUrl] = useState("")

  const source = mode === "text" ? text : url
  const canRun = source.trim().length > 0 && selectedIds.length > 0
  const allSelected = selectedIds.length === personas.length

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:py-16">
      <header className="flex flex-col items-center gap-4 text-center">
        <Badge
          variant="outline"
          className="gap-1.5 rounded-full border-primary/25 bg-primary/5 px-3 py-1 text-primary"
        >
          <ZapIcon className="size-3.5" />
          Synthetic qualitative research
        </Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
          Put your idea in front of a panel
        </h1>
        <p className="max-w-2xl text-pretty text-muted-foreground md:text-lg">
          Paste a product concept, ad, speech, or landing page. A panel of AI
          personas reacts in character and returns free-text feedback plus
          structured metrics on sentiment, price, intent, and trust.
        </p>
      </header>

      <Card className="overflow-hidden">
        <CardContent className="flex flex-col gap-4 p-4 md:p-6">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as AnalysisMode)}
          >
            <div className="flex items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="text">
                  <TypeIcon data-icon="inline-start" />
                  Paste text
                </TabsTrigger>
                <TabsTrigger value="url">
                  <LinkIcon data-icon="inline-start" />
                  From URL
                </TabsTrigger>
              </TabsList>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Concept · Ad · Speech · Landing page
              </span>
            </div>

            <TabsContent value="text" className="mt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="e.g. Introducing Aura — a $29/mo AI sleep coach that listens overnight and builds a personalized wind-down routine..."
                className="resize-none text-base"
              />
            </TabsContent>
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
          </Tabs>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">
              Your panel
              <span className="ml-1.5 text-muted-foreground">
                · {selectedIds.length} of {personas.length} selected
              </span>
            </h2>
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((p) => (
            <PersonaSelectCard
              key={p.id}
              persona={p}
              selected={selectedIds.includes(p.id)}
              onToggle={() => onToggle(p.id)}
            />
          ))}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 mx-auto w-full max-w-md">
        <Button
          size="lg"
          className="w-full shadow-lg"
          disabled={!canRun}
          onClick={() => onRun({ mode, source })}
        >
          <ZapIcon data-icon="inline-start" />
          Run focus group
          {selectedIds.length > 0 && (
            <span className="ml-1 opacity-80">
              · {selectedIds.length} personas
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
