import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mongoEnabled } from "@/lib/mongo"
import {
  getSummary,
  getByPanel,
  getByMode,
  getByDay,
  getRecent,
} from "@/lib/metrics"
import { RunsByDayChart, SliceChart } from "@/components/admin/usage-charts"

// Always render fresh — this is an admin view of live data.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const usd = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n
  )
const num = (n: number) => new Intl.NumberFormat("en-US").format(n)

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card size="sm">
      <CardContent className="px-(--card-spacing)">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default async function AdminPage() {
  if (!mongoEnabled()) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold">Usage dashboard</h1>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>No database configured</CardTitle>
            <CardDescription>
              Set <code>MONGODB_URI</code> (and optionally{" "}
              <code>MONGODB_DB</code>) so analysis runs are recorded and metrics
              appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  const [summary, byPanel, byMode, byDay, recent] = await Promise.all([
    getSummary(),
    getByPanel(),
    getByMode(),
    getByDay(30),
    getRecent(25),
  ])

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usage dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {num(summary.total)} total runs recorded
          </p>
        </div>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          ← Back to app
        </Link>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total runs" value={num(summary.total)} />
        <StatTile
          label="Successful"
          value={num(summary.ok)}
          hint={`${num(summary.failed)} failed`}
        />
        <StatTile
          label="Input tokens"
          value={num(summary.tokensInput)}
        />
        <StatTile
          label="Output tokens"
          value={num(summary.tokensOutput)}
        />
        <StatTile
          label="Est. cost"
          value={usd(summary.estCost)}
          hint="estimated"
        />
        <StatTile
          label="Avg panelists"
          value={summary.avgPanelists.toFixed(1)}
        />
      </section>

      <section className="mt-6">
        <RunsByDayChart data={byDay} />
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <SliceChart title="Runs by panel" data={byPanel} />
        <SliceChart title="Runs by input mode" data={byMode} />
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Recent runs</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No runs yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl ring-1 ring-foreground/10">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-foreground/10">
                  <th className="px-4 py-2.5 font-medium">When</th>
                  <th className="px-4 py-2.5 font-medium">Title</th>
                  <th className="px-4 py-2.5 font-medium">Panel</th>
                  <th className="px-4 py-2.5 font-medium">Mode</th>
                  <th className="px-4 py-2.5 font-medium text-right">
                    Panelists
                  </th>
                  <th className="px-4 py-2.5 font-medium text-right">Tokens</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-foreground/5 last:border-0 hover:bg-foreground/[0.03]"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="max-w-[22rem] truncate px-4 py-2.5">
                      <Link
                        href={`/admin/runs/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.title || "(untitled)"}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 capitalize">{r.panel}</td>
                    <td className="px-4 py-2.5 uppercase text-muted-foreground">
                      {r.mode}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {r.panelistCount}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {num(r.tokens)}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.ok ? (
                        <Badge variant="secondary">ok</Badge>
                      ) : (
                        <Badge variant="destructive">failed</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-8 text-xs text-muted-foreground">
        Cost is estimated from placeholder gpt-5.5 token rates — update the
        constants in <code>lib/metrics.ts</code> with the real rates.
      </p>
    </main>
  )
}
