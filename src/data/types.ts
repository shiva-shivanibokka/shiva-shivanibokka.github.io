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
  metrics?: string[]
  url: string
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
