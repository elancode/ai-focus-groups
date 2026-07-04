"use client"

import { useEffect, useState } from "react"

import { Spinner } from "@/components/ui/spinner"
import { Card } from "@/components/ui/card"
import { PANELS } from "@/lib/panels"
import type { PanelId, Persona } from "@/lib/types"
import { PersonaAvatar } from "./persona-avatar"

export function RunningView({
  panel,
  personas,
}: {
  panel: PanelId
  personas: Persona[]
}) {
  const meta = PANELS[panel]
  const statuses = meta.statuses
  const [statusIdx, setStatusIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(
      () => setStatusIdx((i) => (i + 1) % statuses.length),
      2000
    )
    return () => clearInterval(id)
  }, [statuses.length])

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Spinner />
          Panel in session
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          {personas.length} {meta.memberNoun} are reviewing your idea
        </h2>
        <p className="text-muted-foreground" aria-live="polite">
          {statuses[statusIdx]}
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
        {personas.map((p, i) => (
          <Card
            key={p.id}
            className="flex flex-row items-center gap-3 p-3 text-left"
            style={{ animation: `pulse 2s ease-in-out ${i * 0.18}s infinite` }}
          >
            <PersonaAvatar name={p.name} seed={p.id} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {p.subtitle ?? p.archetype}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <p className="max-w-md text-xs text-muted-foreground">
        Each {meta.memberNoun.replace(/s$/, "")} is an independent agent
        reasoning about your content. This usually takes a few moments.
      </p>
    </div>
  )
}
