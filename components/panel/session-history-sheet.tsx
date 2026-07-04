"use client"

import { Plus } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PANELS } from "@/lib/panels"
import type { PanelId, Study } from "@/lib/types"

const PANEL_DOT: Record<PanelId, string> = {
  consumer: "bg-chart-1",
  design: "bg-chart-2",
  startup: "bg-chart-5",
}

function relativeTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return "Just now"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return "Yesterday"
  return `${d}d ago`
}

function metricTone(study: Study): string {
  const m = study.headlineMetric
  if (m.startsWith("+") || /invest/i.test(m)) return "text-positive"
  if (m.startsWith("-") || /pass|caution/i.test(m)) return "text-negative"
  const n = parseFloat(m)
  if (!Number.isNaN(n)) return n >= 7 ? "text-positive" : n >= 5 ? "text-warning" : "text-negative"
  return "text-foreground"
}

export function SessionHistorySheet({
  open,
  onOpenChange,
  studies,
  currentId,
  onOpen,
  onNew,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  studies: Study[]
  currentId: string | null
  onOpen: (study: Study) => void
  onNew: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>This session</SheetTitle>
          <SheetDescription>
            {studies.length} {studies.length === 1 ? "study" : "studies"} · kept
            on this device, not saved to an account
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2.5 p-4">
            {studies.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No studies yet. Run a panel to see it here.
              </p>
            )}
            {studies.map((study) => {
              const meta = PANELS[study.panel]
              const isCurrent = study.id === currentId
              return (
                <button
                  key={study.id}
                  type="button"
                  onClick={() => onOpen(study)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/40",
                    isCurrent && "border-primary/60 bg-primary/[0.04] ring-1 ring-primary/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          PANEL_DOT[study.panel]
                        )}
                      />
                      {meta.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(study.createdAt)}
                    </span>
                  </div>
                  <p className="text-pretty text-sm font-medium">
                    {study.concept}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {study.sourceLabel}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-mono text-sm font-semibold tabular-nums",
                        metricTone(study)
                      )}
                    >
                      {study.headlineMetric}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>

        <SheetFooter className="border-t">
          <Button onClick={onNew}>
            <Plus data-icon="inline-start" />
            New study
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
