import type { LucideIcon } from "lucide-react"
import { Users, PenLine, Rocket } from "lucide-react"

import type { Persona, PanelId } from "./types"
import { PRESET_PERSONAS } from "./personas"

/* ------------------------------------------------------------------ *
 * Design panel roster (working designers)
 * ------------------------------------------------------------------ */

export const DESIGN_PERSONAS: Persona[] = [
  {
    id: "design-elena",
    name: "Elena Vasquez",
    archetype: "Usability & user flows",
    specialty: "Usability & user flows",
    subtitle: "Senior UX Designer · Google",
    tag: "UX",
    occupation: "Senior UX Designer",
    cohort: "Millennial",
    age: 34,
    location: "Mountain View, CA",
    bio: "A rigorous UX designer who evaluates whether real users can actually complete the core task. She walks the flow step by step, flags dead ends and ambiguous states, and cares far more about clarity than polish.",
    traits: ["Flow-obsessed", "User-first", "Pragmatic", "Detail-oriented"],
  },
  {
    id: "design-theo",
    name: "Theo Brandt",
    archetype: "Brand & visual craft",
    specialty: "Brand & visual craft",
    subtitle: "Creative Director · Pentagram",
    tag: "Brand",
    occupation: "Creative Director",
    cohort: "Gen X",
    age: 46,
    location: "New York, NY",
    bio: "A creative director with an exacting eye for typography, hierarchy, and brand voice. He judges craft, restraint, and whether the work has a point of view — and is quick to call out anything generic or derivative.",
    traits: ["Craft-driven", "Opinionated", "Typography nerd", "Brand-led"],
  },
  {
    id: "design-aisha",
    name: "Aisha Nkemdi",
    archetype: "Consistency & scale",
    specialty: "Consistency & scale",
    subtitle: "Design Systems Lead · Figma",
    tag: "Systems",
    occupation: "Design Systems Lead",
    cohort: "Millennial",
    age: 36,
    location: "Remote",
    bio: "A design-systems lead who thinks in components and tokens. She scrutinizes consistency, spacing rhythm, and whether patterns will scale, and distrusts one-off decisions that break the system.",
    traits: ["Systematic", "Consistency-first", "Token-minded", "Scalable"],
  },
  {
    id: "design-ravi",
    name: "Ravi Menon",
    archetype: "Delight & micro-interaction",
    specialty: "Delight & micro-interaction",
    subtitle: "Motion & Interaction Designer",
    tag: "Motion",
    occupation: "Motion & Interaction Designer",
    cohort: "Millennial",
    age: 31,
    location: "London, UK",
    bio: "A motion and interaction designer focused on feel — transitions, feedback, and the small moments that make a product feel alive. He notices when interactions are janky, missing, or overdone.",
    traits: ["Delight-focused", "Feel-obsessed", "Playful", "Precise timing"],
  },
  {
    id: "design-dana",
    name: "Dana Fisher",
    archetype: "Inclusion & clarity",
    specialty: "Inclusion & clarity",
    subtitle: "Design Researcher · Accessibility",
    tag: "Research",
    occupation: "Design Researcher",
    cohort: "Gen X",
    age: 44,
    location: "Seattle, WA",
    bio: "A design researcher specializing in accessibility and inclusive design. She checks contrast, reading level, affordances, and whether the experience works for people with disabilities or low digital literacy.",
    traits: ["Inclusive", "Accessibility-first", "Evidence-led", "Plain-language"],
  },
]

/* ------------------------------------------------------------------ *
 * Startup panel roster (operators & investors)
 * ------------------------------------------------------------------ */

export const STARTUP_PERSONAS: Persona[] = [
  {
    id: "startup-marcus",
    name: "Marcus Bell",
    archetype: "Early-stage viability",
    specialty: "Early-stage viability",
    subtitle: "Partner · Y Combinator",
    tag: "YC",
    occupation: "Partner",
    cohort: "Gen X",
    age: 45,
    location: "San Francisco, CA",
    bio: "An early-stage partner who has seen thousands of pitches. He probes whether people actually want this, how fast it can be built, and whether the founders can execute. He is direct and allergic to hand-waving.",
    traits: ["Founder-focused", "Execution-minded", "Blunt", "Pattern-matching"],
  },
  {
    id: "startup-priyanka",
    name: "Priyanka Rao",
    archetype: "Market & venture scale",
    specialty: "Market & venture scale",
    subtitle: "Partner · Sequoia Capital",
    tag: "VC",
    occupation: "Partner",
    cohort: "Millennial",
    age: 39,
    location: "Menlo Park, CA",
    bio: "A growth-stage investor who sizes markets and asks whether this can become a venture-scale outcome. She interrogates TAM, timing, and whether the wedge expands into something huge.",
    traits: ["Market-sizing", "Ambition-seeking", "Analytical", "Big-outcome"],
  },
  {
    id: "startup-jordan",
    name: "Jordan Kim",
    archetype: "Acquisition & retention",
    specialty: "Acquisition & retention",
    subtitle: "Growth Lead · ex-Uber",
    tag: "Growth",
    occupation: "Growth Lead",
    cohort: "Millennial",
    age: 35,
    location: "Los Angeles, CA",
    bio: "A growth operator who thinks in funnels, CAC, and retention curves. He asks how this gets its first thousand users, whether they come back, and whether the unit economics survive paid acquisition.",
    traits: ["Funnel-minded", "Data-driven", "Retention-focused", "Channel-savvy"],
  },
  {
    id: "startup-sofia",
    name: "Sofia Ramos",
    archetype: "Feasibility & scale",
    specialty: "Feasibility & scale",
    subtitle: "Staff Engineer / Architect",
    tag: "Tech",
    occupation: "Staff Engineer / Architect",
    cohort: "Gen X",
    age: 42,
    location: "Austin, TX",
    bio: "A technical architect who judges whether the thing can actually be built and scaled. She flags hard engineering problems, data and privacy constraints, and where the technical moat is real vs imaginary.",
    traits: ["Feasibility-first", "Scale-aware", "Rigorous", "Risk-flagging"],
  },
  {
    id: "startup-ben",
    name: "Ben Alvarez",
    archetype: "Positioning & messaging",
    specialty: "Positioning & messaging",
    subtitle: "Head of Marketing",
    tag: "Marketing",
    occupation: "Head of Marketing",
    cohort: "Millennial",
    age: 38,
    location: "Chicago, IL",
    bio: "A marketing leader focused on positioning and the story. He asks who this is for, what it replaces, and whether the value proposition is sharp enough to cut through a crowded market.",
    traits: ["Positioning-led", "Story-first", "Category-aware", "Crisp messaging"],
  },
  {
    id: "startup-nadia",
    name: "Nadia Cole",
    archetype: "Narrative & press angle",
    specialty: "Narrative & press angle",
    subtitle: "PR & Comms Strategist",
    tag: "PR",
    occupation: "PR & Comms Strategist",
    cohort: "Gen X",
    age: 41,
    location: "Brooklyn, NY",
    bio: "A communications strategist who evaluates the narrative and press angle. She asks whether there is a story worth telling, how it could be misread, and where the reputational or trust landmines are.",
    traits: ["Narrative-driven", "Reputation-aware", "Skeptical", "Angle-seeking"],
  },
]

/* ------------------------------------------------------------------ *
 * Panel metadata
 * ------------------------------------------------------------------ */

export type PanelMeta = {
  id: PanelId
  label: string
  /** Title on the "Choose your panel" card, e.g. "Startup pitch review" */
  cardTitle: string
  /** One-line description on the "Choose your panel" card */
  tagline: string
  /** Roster caption shown under the "Panel members" heading */
  description: string
  icon: LucideIcon
  /** Run button label */
  ctaLabel: string
  /** Plural noun for members, e.g. "personas" | "designers" | "experts" */
  memberNoun: string
  personas: Persona[]
  /** How many personas are selected by default */
  defaultCount: number
  /** Cycling status lines shown on the running screen */
  statuses: string[]
  /** Short dot/badge colour token, e.g. "chart-1" */
  dot: string
}

export const PANELS: Record<PanelId, PanelMeta> = {
  consumer: {
    id: "consumer",
    label: "Consumer",
    cardTitle: "Consumer panel",
    tagline: "Everyday buyers react like real customers.",
    description: "Everyday buyers across four generations",
    icon: Users,
    ctaLabel: "Run focus group",
    memberNoun: "personas",
    personas: PRESET_PERSONAS,
    defaultCount: 5,
    dot: "chart-1",
    statuses: [
      "Reading the material…",
      "Forming first impressions…",
      "Weighing the price…",
      "Checking for red flags…",
      "Scoring purchase intent…",
      "Writing up honest feedback…",
    ],
  },
  design: {
    id: "design",
    label: "Design",
    cardTitle: "Design review",
    tagline: "Working designers critique the craft.",
    description: "Working designers critique craft, usability & clarity",
    icon: PenLine,
    ctaLabel: "Run design review",
    memberNoun: "designers",
    personas: DESIGN_PERSONAS,
    defaultCount: DESIGN_PERSONAS.length,
    dot: "chart-2",
    statuses: [
      "Scanning the layout…",
      "Walking the core flow…",
      "Checking contrast & type…",
      "Hunting usability snags…",
      "Rating visual craft…",
      "Writing the critique…",
    ],
  },
  startup: {
    id: "startup",
    label: "Startup",
    cardTitle: "Startup pitch review",
    tagline: "Operators & investors weigh the business.",
    description: "Operators & investors pressure-test the business",
    icon: Rocket,
    ctaLabel: "Run pitch review",
    memberNoun: "experts",
    personas: STARTUP_PERSONAS,
    defaultCount: STARTUP_PERSONAS.length,
    dot: "chart-5",
    statuses: [
      "Reading the pitch…",
      "Sizing the market…",
      "Stress-testing the model…",
      "Probing the moat…",
      "Weighing the risks…",
      "Forming a verdict…",
    ],
  },
}

export const PANEL_ORDER: PanelId[] = ["consumer", "design", "startup"]
