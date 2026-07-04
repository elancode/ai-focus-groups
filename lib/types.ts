import type {
  PersonaVerdict,
  DesignVerdict,
  StartupVerdict,
} from "./analysis"

export type Cohort = "Gen Z" | "Millennial" | "Gen X" | "Boomer"

export type PanelId = "consumer" | "design" | "startup"

export type Persona = {
  id: string
  name: string
  /** Short role label, e.g. "Budget-Conscious Parent" */
  archetype: string
  cohort: Cohort
  age: number
  occupation: string
  location: string
  /** Rich description used to steer the agent */
  bio: string
  traits: string[]
  custom?: boolean
  /** Expert-panel subtitle, e.g. "Senior UX Designer · Google". Falls back to "{age} · {occupation}". */
  subtitle?: string
  /** Expert critique/investment lens. Falls back to archetype. */
  specialty?: string
  /** Neutral discipline/firm tag. Falls back to cohort. */
  tag?: string
}

export type AnalysisMode = "text" | "url"

/** Any of the three panel-specific verdict shapes. */
export type AnyVerdict = PersonaVerdict | DesignVerdict | StartupVerdict

/** A single persona's completed evaluation. Defaults to the consumer verdict. */
export type PanelResponse<V = PersonaVerdict> = {
  persona: Persona
  verdict: V
}

export type Session = {
  id: string
  createdAt: number
  title: string
  mode: AnalysisMode
  /** Original user input (URL or raw text) */
  source: string
  /** The resolved content that was actually analyzed */
  content: string
  /** Which panel produced this run */
  panel: PanelId
  responses: PanelResponse<AnyVerdict>[]
}

/** A completed run, kept in session history. */
export type Study = {
  id: string
  createdAt: number
  /** Derived title, e.g. "Aura — AI sleep coach" */
  concept: string
  /** e.g. "$29/mo concept · URL" */
  sourceLabel: string
  panel: PanelId
  memberCount: number
  /** Headline result, e.g. "+38" | "7.2" | "Lean invest" */
  headlineMetric: string
  session: Session
}
