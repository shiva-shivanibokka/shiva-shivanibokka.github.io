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
  /**
   * The GitHub page, omitted when the repo is private. A "View repo" link that
   * 404s for every visitor is worse than no link, so the card simply drops it.
   */
  url?: string
  /**
   * The repo's homepage, but only when it actually responded at build time.
   * Free-tier hosts go away without warning, so a link is never emitted on the
   * strength of the field merely being set — see checkLive in build-projects.ts.
   */
  demo?: string
  /**
   * What to call the demo link. "Live demo" is the default and is a claim: the
   * page computes something when you use it. A page that replays a recorded run
   * says "Replay" instead, because calling it live would promise a reader
   * something it does not do.
   */
  demoLabel?: string
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
