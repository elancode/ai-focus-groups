import "server-only"
import { ObjectId } from "mongodb"

import { getRunsCollection, mongoEnabled, type RunDoc } from "./mongo"

/* ------------------------------------------------------------------ *
 * Cost estimate — UPDATE these with the real gpt-5.5 rates.
 * ------------------------------------------------------------------ */
export const PRICE_PER_MTOK_IN = 1.25 // USD per 1M input tokens (placeholder)
export const PRICE_PER_MTOK_OUT = 10 // USD per 1M output tokens (placeholder)

export function estCost(tokensInput: number, tokensOutput: number): number {
  return (
    (tokensInput / 1_000_000) * PRICE_PER_MTOK_IN +
    (tokensOutput / 1_000_000) * PRICE_PER_MTOK_OUT
  )
}

/** Best-effort insert; no-ops when Mongo isn't configured, never throws. */
export async function recordRun(doc: Omit<RunDoc, "_id">): Promise<void> {
  if (!mongoEnabled()) return
  try {
    const col = await getRunsCollection()
    await col.insertOne(doc as RunDoc)
  } catch (err) {
    console.log(
      "[metrics] recordRun failed:",
      err instanceof Error ? err.message : err
    )
  }
}

/* ------------------------------------------------------------------ *
 * Dashboard queries
 * ------------------------------------------------------------------ */

export type Summary = {
  total: number
  ok: number
  failed: number
  tokensInput: number
  tokensOutput: number
  estCost: number
  avgPanelists: number
}

const EMPTY_SUMMARY: Summary = {
  total: 0,
  ok: 0,
  failed: 0,
  tokensInput: 0,
  tokensOutput: 0,
  estCost: 0,
  avgPanelists: 0,
}

export async function getSummary(): Promise<Summary> {
  if (!mongoEnabled()) return EMPTY_SUMMARY
  const col = await getRunsCollection()
  const [row] = (await col
    .aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          ok: { $sum: { $cond: ["$ok", 1, 0] } },
          tokensInput: { $sum: "$tokensInput" },
          tokensOutput: { $sum: "$tokensOutput" },
          panelists: { $sum: "$panelistCount" },
        },
      },
    ])
    .toArray()) as Array<{
    total: number
    ok: number
    tokensInput: number
    tokensOutput: number
    panelists: number
  }>
  if (!row) return EMPTY_SUMMARY
  return {
    total: row.total,
    ok: row.ok,
    failed: row.total - row.ok,
    tokensInput: row.tokensInput ?? 0,
    tokensOutput: row.tokensOutput ?? 0,
    estCost: estCost(row.tokensInput ?? 0, row.tokensOutput ?? 0),
    avgPanelists: row.total ? (row.panelists ?? 0) / row.total : 0,
  }
}

export type Slice = { key: string; count: number }

async function groupBy(field: string): Promise<Slice[]> {
  if (!mongoEnabled()) return []
  const col = await getRunsCollection()
  const rows = (await col
    .aggregate([
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray()) as Array<{ _id: string; count: number }>
  return rows.map((r) => ({ key: r._id ?? "unknown", count: r.count }))
}

export function getByPanel(): Promise<Slice[]> {
  return groupBy("panel")
}
export function getByMode(): Promise<Slice[]> {
  return groupBy("mode")
}

export type DayCount = { date: string; count: number }

export async function getByDay(days = 30): Promise<DayCount[]> {
  const since = new Date(Date.now() - (days - 1) * 86_400_000)
  since.setUTCHours(0, 0, 0, 0)

  const counts = new Map<string, number>()
  if (mongoEnabled()) {
    const col = await getRunsCollection()
    const rows = (await col
      .aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()) as Array<{ _id: string; count: number }>
    for (const r of rows) counts.set(r._id, r.count)
  }

  // Fill every day in the window so the chart has no gaps.
  const out: DayCount[] = []
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000)
    const key = d.toISOString().slice(0, 10)
    out.push({ date: key, count: counts.get(key) ?? 0 })
  }
  return out
}

export type RecentRun = {
  id: string
  createdAt: string
  panel: string
  mode: string
  title: string
  panelistCount: number
  tokens: number
  ok: boolean
}

export async function getRecent(limit = 25): Promise<RecentRun[]> {
  if (!mongoEnabled()) return []
  const col = await getRunsCollection()
  const rows = await col
    .find(
      {},
      {
        projection: {
          panel: 1,
          mode: 1,
          title: 1,
          panelistCount: 1,
          tokensInput: 1,
          tokensOutput: 1,
          ok: 1,
          createdAt: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()
  return rows.map((r) => ({
    id: String(r._id),
    createdAt: (r.createdAt as Date).toISOString(),
    panel: r.panel,
    mode: r.mode,
    title: r.title,
    panelistCount: r.panelistCount,
    tokens: (r.tokensInput ?? 0) + (r.tokensOutput ?? 0),
    ok: r.ok,
  }))
}

export async function getRun(id: string): Promise<RunDoc | null> {
  if (!mongoEnabled() || !ObjectId.isValid(id)) return null
  const col = await getRunsCollection()
  return col.findOne({ _id: new ObjectId(id) })
}
