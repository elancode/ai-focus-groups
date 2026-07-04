"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PANELS, PANEL_ORDER } from "@/lib/panels"
import {
  buildOverview,
  buildDesignOverview,
  buildStartupOverview,
  type DesignResponse,
  type StartupResponse,
} from "@/lib/aggregate"
import type {
  AnalysisMode,
  PanelId,
  PanelResponse,
  Persona,
  Session,
  Study,
} from "@/lib/types"
import { SetupPanel } from "./setup-panel"
import { RunningView } from "./running-view"
import { ResultsDashboard } from "./results-dashboard"
import { SessionHistorySheet } from "./session-history-sheet"

type Phase = "setup" | "running" | "results"

const STORAGE_KEY = "panel:studies"

function initialSelection(): Record<PanelId, string[]> {
  const out = {} as Record<PanelId, string[]>
  for (const id of PANEL_ORDER) {
    const meta = PANELS[id]
    out[id] = meta.personas.slice(0, meta.defaultCount).map((p) => p.id)
  }
  return out
}

function emptyCustoms(): Record<PanelId, Persona[]> {
  return { consumer: [], design: [], startup: [] }
}

function headlineMetric(session: Session): string {
  if (session.panel === "design") {
    return buildDesignOverview(
      session.responses as DesignResponse[]
    ).craftScore.toFixed(1)
  }
  if (session.panel === "startup") {
    return buildStartupOverview(session.responses as StartupResponse[])
      .verdictLabel
  }
  const o = buildOverview(session.responses as PanelResponse[])
  return `${o.netSentiment > 0 ? "+" : ""}${o.netSentiment}`
}

export function FocusGroupApp() {
  const [phase, setPhase] = useState<Phase>("setup")
  const [activePanel, setActivePanel] = useState<PanelId>("consumer")
  const [customByPanel, setCustomByPanel] = useState(emptyCustoms)
  const [selectedByPanel, setSelectedByPanel] = useState(initialSelection)
  const [session, setSession] = useState<Session | null>(null)
  const [studies, setStudies] = useState<Study[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)

  // Load session history (survives reloads within the tab, no account).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) setStudies(JSON.parse(raw) as Study[])
    } catch {
      /* ignore */
    }
  }, [])

  function persistStudies(next: Study[]) {
    setStudies(next)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const personas = useMemo(
    () => [...PANELS[activePanel].personas, ...customByPanel[activePanel]],
    [activePanel, customByPanel]
  )
  const selectedIds = selectedByPanel[activePanel]
  const selectedPersonas = useMemo(
    () => personas.filter((p) => selectedIds.includes(p.id)),
    [personas, selectedIds]
  )

  function setSelected(panel: PanelId, ids: string[]) {
    setSelectedByPanel((prev) => ({ ...prev, [panel]: ids }))
  }

  function toggle(id: string) {
    const ids = selectedByPanel[activePanel]
    setSelected(
      activePanel,
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    )
  }

  function selectAll(all: boolean) {
    setSelected(activePanel, all ? personas.map((p) => p.id) : [])
  }

  function addCustom(p: Persona) {
    setCustomByPanel((prev) => ({
      ...prev,
      [activePanel]: [...prev[activePanel], p],
    }))
    setSelected(activePanel, [...selectedByPanel[activePanel], p.id])
    toast.success(`Added ${p.name} to your ${PANELS[activePanel].label} panel`)
  }

  function removeCustom(id: string) {
    setCustomByPanel((prev) => ({
      ...prev,
      [activePanel]: prev[activePanel].filter((p) => p.id !== id),
    }))
    setSelected(
      activePanel,
      selectedByPanel[activePanel].filter((x) => x !== id)
    )
  }

  async function run({ mode, source }: { mode: AnalysisMode; source: string }) {
    const panel = activePanel
    const members = selectedPersonas
    setPhase("running")
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, source, personas: members, panel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.")
      const nextSession = data.session as Session
      setSession(nextSession)
      setPhase("results")

      const study: Study = {
        id: nextSession.id,
        createdAt: nextSession.createdAt,
        concept: nextSession.title,
        sourceLabel: `${mode === "url" ? "URL" : "Text"} · ${nextSession.responses.length} ${PANELS[panel].memberNoun}`,
        panel,
        memberCount: nextSession.responses.length,
        headlineMetric: headlineMetric(nextSession),
        session: nextSession,
      }
      persistStudies([study, ...studies].slice(0, 30))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed.")
      setPhase("setup")
    }
  }

  function openStudy(study: Study) {
    setActivePanel(study.panel)
    setSession(study.session)
    setPhase("results")
    setHistoryOpen(false)
  }

  function reset() {
    setSession(null)
    setPhase("setup")
    setHistoryOpen(false)
  }

  const historySheet = (
    <SessionHistorySheet
      open={historyOpen}
      onOpenChange={setHistoryOpen}
      studies={studies}
      currentId={session?.id ?? null}
      onOpen={openStudy}
      onNew={reset}
    />
  )

  if (phase === "running") {
    return <RunningView panel={activePanel} personas={selectedPersonas} />
  }

  if (phase === "results" && session) {
    return (
      <>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
          <ResultsDashboard
            session={session}
            onReset={reset}
            historyCount={studies.length}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        </div>
        {historySheet}
      </>
    )
  }

  return (
    <>
      <SetupPanel
        activePanel={activePanel}
        onSetPanel={setActivePanel}
        personas={personas}
        selectedIds={selectedIds}
        onToggle={toggle}
        onSelectAll={selectAll}
        onAddCustom={addCustom}
        onRemoveCustom={removeCustom}
        onRun={run}
        historyCount={studies.length}
        onOpenHistory={() => setHistoryOpen(true)}
      />
      {historySheet}
    </>
  )
}
