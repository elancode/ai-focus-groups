"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { PANELS, PANEL_ORDER, MAX_PANELISTS } from "@/lib/panels"
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
    if (ids.includes(id)) {
      setSelected(
        activePanel,
        ids.filter((x) => x !== id)
      )
      return
    }
    if (ids.length >= MAX_PANELISTS) {
      toast.error(`You can include up to ${MAX_PANELISTS} panelists per run.`)
      return
    }
    setSelected(activePanel, [...ids, id])
  }

  function selectAll(all: boolean) {
    setSelected(
      activePanel,
      all ? personas.slice(0, MAX_PANELISTS).map((p) => p.id) : []
    )
  }

  function addCustom(p: Persona) {
    setCustomByPanel((prev) => ({
      ...prev,
      [activePanel]: [...prev[activePanel], p],
    }))
    const ids = selectedByPanel[activePanel]
    if (ids.length < MAX_PANELISTS) {
      setSelected(activePanel, [...ids, p.id])
      toast.success(`Added ${p.name} to your ${PANELS[activePanel].label} panel`)
    } else {
      toast.success(
        `Added ${p.name} to the roster — you're at the ${MAX_PANELISTS}-panelist limit, so deselect one to include them.`
      )
    }
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
      // The server can fail with a non-JSON body (platform timeout / crash);
      // read text first so we surface the real error instead of a JSON parse error.
      const rawBody = await res.text()
      let data: { session?: Session; error?: string } | null = null
      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch {
        data = null
      }
      if (!res.ok || !data?.session) {
        throw new Error(
          data?.error ??
            (res.status === 504 || res.status === 408 || res.status === 502
              ? "The analysis took too long and timed out. Try selecting fewer panelists, or paste the text directly."
              : `Analysis failed (HTTP ${res.status}). Please try again.`)
        )
      }
      const nextSession = data.session
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
        // Drop the (large) screenshot data-URL from persisted history to stay
        // well under the sessionStorage quota; the live view still shows it.
        session: { ...nextSession, screenshot: undefined },
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
