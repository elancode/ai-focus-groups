import "server-only"
import { MongoClient, type Collection, type ObjectId } from "mongodb"

/** One persisted analysis run. */
export type RunDoc = {
  _id?: ObjectId
  createdAt: Date
  panel: string
  mode: "url" | "text"
  /** The query — the URL or the pasted text. */
  source: string
  title: string
  panelistCount: number
  tokensInput: number
  tokensOutput: number
  ok: boolean
  error?: string
  responses: Array<{
    persona: {
      id: string
      name: string
      subtitle?: string
      archetype: string
      cohort: string
    }
    verdict: unknown
  }>
}

export function mongoEnabled(): boolean {
  return Boolean(process.env.MONGODB_URI)
}

// Cache the connection promise across warm invocations (serverless pattern).
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

function getClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not set")
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect()
  }
  return global._mongoClientPromise
}

export async function getRunsCollection(): Promise<Collection<RunDoc>> {
  const client = await getClient()
  const db = client.db(process.env.MONGODB_DB || "panel")
  return db.collection<RunDoc>("runs")
}
