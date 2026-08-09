export type Domain =
  | 'Agentic'
  | 'LLMs & GenAI'
  | 'Deep Learning'
  | 'ML System Design'
  | 'MLOps'
  | 'Classical ML'
  | 'Data Science'
  | 'NLP'
  | 'Full-Stack / Product'
  | 'Other'

export interface Project {
  slug: string
  title: string
  repo: string
  domain: Domain
  blurb: string
  tech: string[]
  url: string
  /**
   * The repo's homepage, but only when it actually responded at build time.
   * Free-tier hosts go away without warning, so a link is never emitted on the
   * strength of the field merely being set — see checkLive in build-projects.ts.
   */
  demo?: string
  /**
   * A result the README actually states, extracted verbatim — never written or
   * inferred here. Projects whose README claims no outcome simply have none,
   * which is the honest display.
   */
  outcome?: string
}

export const DOMAINS: Domain[] = [
  'Agentic',
  'LLMs & GenAI',
  'Deep Learning',
  'ML System Design',
  'MLOps',
  'Classical ML',
  'Data Science',
  'NLP',
  'Full-Stack / Product',
  'Other',
]
