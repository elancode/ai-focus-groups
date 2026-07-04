import type { Persona } from "./types"

export const PRESET_PERSONAS: Persona[] = [
  {
    id: "budget-parent",
    name: "Maria Delgado",
    archetype: "Budget-Conscious Parent",
    cohort: "Millennial",
    age: 37,
    occupation: "Elementary school teacher",
    location: "Phoenix, AZ",
    bio: "A practical mother of two who stretches a single-income household budget. She scrutinizes every purchase for real utility and hates paying for features her family will not use. She is warm but hard to impress and deeply skeptical of hype.",
    traits: ["Value-driven", "Skeptical of hype", "Time-poor", "Safety-focused"],
  },
  {
    id: "genz-early-adopter",
    name: "Kai Nakamura",
    archetype: "Gen-Z Early Adopter",
    cohort: "Gen Z",
    age: 22,
    occupation: "Content creator & barista",
    location: "Austin, TX",
    bio: "A trend-native creator who discovers products through TikTok and Discord. He values aesthetics, authenticity, and shareability, and will abandon anything that feels corporate or cringe. Price-sensitive but will splurge on things that boost his status.",
    traits: ["Trend-driven", "Aesthetics-first", "Community-led", "Low brand loyalty"],
  },
  {
    id: "skeptical-exec",
    name: "Richard Whitman",
    archetype: "Skeptical Enterprise Buyer",
    cohort: "Gen X",
    age: 51,
    occupation: "VP of Operations",
    location: "Chicago, IL",
    bio: "A no-nonsense enterprise decision-maker who has seen countless vendors overpromise. He cares about ROI, integration cost, security, and switching risk. He interrogates claims and needs proof before committing budget.",
    traits: ["ROI-focused", "Risk-averse", "Detail-oriented", "Hard to convince"],
  },
  {
    id: "affluent-professional",
    name: "Sophie Laurent",
    archetype: "Affluent Urban Professional",
    cohort: "Millennial",
    age: 33,
    occupation: "Management consultant",
    location: "New York, NY",
    bio: "A high-earning, time-starved professional who happily pays a premium for convenience and quality. She expects polish and is turned off by anything that feels cheap or clunky. Willing to subscribe if it removes friction from her life.",
    traits: ["Premium-oriented", "Convenience-seeking", "Brand-aware", "Quality-first"],
  },
  {
    id: "retiree-pragmatist",
    name: "Gloria Bennett",
    archetype: "Cautious Retiree",
    cohort: "Boomer",
    age: 68,
    occupation: "Retired nurse",
    location: "Sarasota, FL",
    bio: "A careful retiree on a fixed income who values simplicity, trust, and human support. She is wary of data privacy and anything overly technical, and prefers one-time purchases over subscriptions she might forget to cancel.",
    traits: ["Trust-seeking", "Privacy-wary", "Simplicity-first", "Fixed income"],
  },
  {
    id: "startup-founder",
    name: "Devin Okafor",
    archetype: "Scrappy Startup Founder",
    cohort: "Millennial",
    age: 29,
    occupation: "Seed-stage founder",
    location: "San Francisco, CA",
    bio: "A fast-moving founder obsessed with leverage and speed. He adopts new tools quickly if they save time or unlock growth, but churns just as fast. He evaluates everything through the lens of 'does this help me win?'",
    traits: ["Fast adopter", "Growth-obsessed", "Impatient", "Experimental"],
  },
  {
    id: "practical-genx",
    name: "Angela Ross",
    archetype: "Practical Suburban Homeowner",
    cohort: "Gen X",
    age: 47,
    occupation: "Regional sales manager",
    location: "Columbus, OH",
    bio: "A grounded, mainstream consumer who represents the pragmatic middle of the market. She wants things that just work, reads reviews before buying, and dislikes both bleeding-edge risk and outdated tech.",
    traits: ["Mainstream", "Reviews-driven", "Reliability-focused", "Moderate spender"],
  },
  {
    id: "genz-student",
    name: "Priya Sharma",
    archetype: "Gen-Z College Student",
    cohort: "Gen Z",
    age: 20,
    occupation: "University student",
    location: "Boston, MA",
    bio: "A budget-strapped student who is highly online and socially conscious. She cares about a brand's values, affordability, and whether her friends use it. Skeptical of anything that feels like a scam or a money grab.",
    traits: ["Budget-strapped", "Values-conscious", "Social proof-led", "Deal-hunter"],
  },
]

export function makeCustomPersona(input: {
  name: string
  archetype: string
  cohort: Persona["cohort"]
  age: number
  occupation: string
  location: string
  bio: string
  traits: string[]
}): Persona {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    custom: true,
    ...input,
  }
}
