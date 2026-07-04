import type { PersonaVerdict } from "./analysis"

export type Cohort =
  | "Gen Z"
  | "Millennial"
  | "Gen X"
  | "Boomer"

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
}

export type AnalysisMode = "text" | "url"

/** A single persona's completed evaluation. */
export type PanelResponse = {
  persona: Persona
  verdict: PersonaVerdict
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
  responses: PanelResponse[]
}
