import type { QuoteSentiment } from "./analysis"

export function formatMoney(value: number, currency: string): string {
  const symbol = currency === "USD" ? "$" : currency
  const rounded = Math.round(value)
  return `${symbol}${rounded.toLocaleString()}`
}

/** Tailwind text color token for a net-sentiment style score (-100..100). */
export function netToneClass(net: number): string {
  if (net >= 25) return "text-positive"
  if (net <= -25) return "text-negative"
  return "text-warning"
}

export function netToneLabel(net: number): string {
  if (net >= 50) return "Enthusiastic"
  if (net >= 25) return "Positive"
  if (net > -25) return "Mixed"
  if (net > -50) return "Negative"
  return "Hostile"
}

export const sentimentBadge: Record<
  QuoteSentiment,
  { label: string; className: string }
> = {
  positive: {
    label: "Positive",
    className: "bg-positive/12 text-positive border-positive/25",
  },
  neutral: {
    label: "Neutral",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  negative: {
    label: "Negative",
    className: "bg-negative/12 text-negative border-negative/25",
  },
}

/** Deterministic initials from a name. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
}

/** Basic sniff test for the URL input. Returns a warning string, or null if it looks like a URL. */
export function urlInputWarning(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null // empty is handled by canRun, not a warning
  if (/\s/.test(v)) return "That looks like text, not a URL."
  const host = v.replace(/^https?:\/\//i, "").split(/[/?#]/)[0]
  if (!host.includes(".") || host.startsWith(".") || host.endsWith("."))
    return "Enter a full URL, like https://example.com."
  try {
    new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
  } catch {
    return "That doesn’t look like a valid URL."
  }
  return null
}

/** True iff the whole trimmed input is a single bare URL (vs. a URL embedded in prose). */
export function isLikelyUrl(raw: string): boolean {
  return raw.trim().length > 0 && urlInputWarning(raw) === null
}

/**
 * Find the first URL anywhere in `raw` — whether it stands alone or is embedded
 * in a sentence. Matches https?://…, www.…, or a bare host.tld/… , strips
 * trailing punctuation, and returns the candidate only if it validates (a 2+
 * letter TLD and a parseable URL). Bare-word false positives (e.g. "Node.js")
 * are acceptable: retrieval is best-effort and falls back to the raw text.
 */
export function extractUrl(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null
  const re =
    /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:[/?#][^\s]*)?)/i
  const match = text.match(re)
  if (!match) return null
  // Drop trailing sentence punctuation the regex may have swallowed.
  const candidate = match[0].replace(/[.,;:)\]}'"]+$/, "")
  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`
  try {
    const tld = new URL(withProtocol).hostname.split(".").pop() ?? ""
    if (!/^[a-z]{2,}$/i.test(tld)) return null
    return candidate
  } catch {
    return null
  }
}

/** Deterministic chart color index (1-5) from a string key. */
export function colorIndex(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 5
  return h + 1
}
