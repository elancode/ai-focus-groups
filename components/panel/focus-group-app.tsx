"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { PRESET_PERSONAS } from "@/lib/personas"
import type { AnalysisMode, Persona, Session } from "@/lib/types"
import { SetupPanel } from "./setup-panel"
import { RunningView } from "./running-view"
import { ResultsDashboard } from "./results-dashboard"

type Phase = "setup" | "running" | "results"

export function FocusGroupApp() {
  const [phase, setPhase] = useState<Phase>("setup")
  const [personas, setPersonas] = useState<Persona[]>(PRESET_PERSONAS)
  const [selectedIds, setSelectedIds] = useState<string[]>(
    PRESET_PERSONAS.slice(0, 5).map((p) => p.id)
  )
  const [session, setSession] = useState<Session | null>(null)

  const selectedPersonas = useMemo(
    () => personas.filter((p) => selectedIds.includes(p.id)),
    [personas, selectedIds]
  )

  function toggle(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    )
  }

  function selectAll(all: boolean) {
    setSelectedIds(all ? personas.map((p) => p.id) : [])
  }

  function addCustom(p: Persona) {
    setPersonas((list) => [p, ...list])
    setSelectedIds((ids) => [p.id, ...ids])
    toast.success(`Added ${p.name} to your panel`)
  }

  async function run({ mode, source }: { mode: AnalysisMode; source: string }) {
    setPhase("running")
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, source, personas: selectedPersonas }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.")
      setSession(data.session as Session)
      setPhase("results")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed.")
      setPhase("setup")
    }
  }

  function reset() {
    setSession(null)
    setPhase("setup")
  }

  if (phase === "running") {
    return <RunningView personas={selectedPersonas} />
  }

  if (phase === "results" && session) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        <ResultsDashboard session={session} onReset={reset} />
      </div>
    )
  }

  return (
    <SetupPanel
      personas={personas}
      selectedIds={selectedIds}
      onToggle={toggle}
      onAddCustom={addCustom}
      onSelectAll={selectAll}
      onRun={run}
    />
  )
}
