import Link from "next/link"
import { notFound } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { getRun } from "@/lib/metrics"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const num = (n: number) => new Intl.NumberFormat("en-US").format(n)

/** Best-effort pull of the shared headline/summary fields from any verdict. */
function readVerdict(v: unknown): { headline?: string; summary?: string } {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>
    return {
      headline: typeof o.headline === "string" ? o.headline : undefined,
      summary: typeof o.summary === "string" ? o.summary : undefined,
    }
  }
  return {}
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const run = await getRun(id)
  if (!run) notFound()

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/admin"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to dashboard
      </Link>

      <header className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{run.title || "(untitled)"}</h1>
        <Badge variant={run.ok ? "secondary" : "destructive"}>
          {run.ok ? "ok" : "failed"}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {run.panel}
        </Badge>
        <Badge variant="outline" className="uppercase">
          {run.mode}
        </Badge>
      </header>

      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(run.createdAt).toLocaleString("en-US")} ·{" "}
        {num(run.tokensInput)} in / {num(run.tokensOutput)} out tokens ·{" "}
        {run.panelistCount} panelist{run.panelistCount === 1 ? "" : "s"}
      </p>

      {run.error ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription className="text-destructive">
              {run.error}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Query</CardTitle>
          <CardDescription>
            {run.mode === "url" ? "Submitted URL" : "Pasted text"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {run.mode === "url" ? (
            <a
              href={run.source}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm text-primary hover:underline"
            >
              {run.source}
            </a>
          ) : (
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">
              {run.source}
            </pre>
          )}
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Responses ({run.responses.length})
        </h2>
        {run.responses.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No responses were recorded for this run.
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {run.responses.map((r, i) => {
              const { headline, summary } = readVerdict(r.verdict)
              return (
                <Card key={r.persona.id ?? i}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {r.persona.name}
                    </CardTitle>
                    <CardDescription>
                      {r.persona.subtitle ?? r.persona.archetype}
                      {r.persona.cohort ? ` · ${r.persona.cohort}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {headline ? (
                      <p className="font-medium">{headline}</p>
                    ) : null}
                    {summary ? (
                      <p className="text-sm text-muted-foreground">{summary}</p>
                    ) : null}
                    <Accordion>
                      <AccordionItem value="raw">
                        <AccordionTrigger className="text-xs text-muted-foreground">
                          Raw verdict JSON
                        </AccordionTrigger>
                        <AccordionContent>
                          <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
                            {JSON.stringify(r.verdict, null, 2)}
                          </pre>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
