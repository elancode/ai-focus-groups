"use client"

import { ArrowLeft, History, Printer, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PANELS } from "@/lib/panels"
import type { Session } from "@/lib/types"
import { ConsumerResults } from "./results/consumer-results"
import { DesignCritique } from "./results/design-critique"
import { StartupMemo } from "./results/startup-memo"

export function ResultsDashboard({
  session,
  onReset,
  historyCount,
  onOpenHistory,
}: {
  session: Session
  onReset: () => void
  historyCount: number
  onOpenHistory: () => void
}) {
  const meta = PANELS[session.panel]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={onReset} className="-ml-2">
          <ArrowLeft data-icon="inline-start" />
          New study
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer data-icon="inline-start" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenHistory}>
            <History data-icon="inline-start" />
            History
            {historyCount > 0 && (
              <span className="ml-1 rounded-full bg-secondary px-1.5 font-mono text-xs">
                {historyCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <Badge variant="secondary" className="w-fit gap-1.5">
            <meta.icon className="size-3.5" />
            {meta.label} panel
          </Badge>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {session.title}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            {session.responses.length} {meta.memberNoun} ·{" "}
            {session.mode === "url" ? "URL" : "Text"} analysis
          </p>
        </div>
      </div>

      {session.screenshot && (
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.screenshot}
            alt="Screenshot of the analyzed page"
            className="h-24 w-40 shrink-0 rounded-md border object-cover object-top"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium">Analyzed page</p>
            <p className="text-xs text-muted-foreground">
              This review is based on the page shown here.
            </p>
          </div>
        </div>
      )}

      {session.panel === "consumer" && <ConsumerResults session={session} />}
      {session.panel === "design" && <DesignCritique session={session} />}
      {session.panel === "startup" && <StartupMemo session={session} />}
    </div>
  )
}
