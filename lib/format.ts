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

/** Deterministic chart color index (1-5) from a string key. */
export function colorIndex(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 5
  return h + 1
}
