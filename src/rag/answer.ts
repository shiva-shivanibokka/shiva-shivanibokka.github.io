import type { ScoredChunk } from './retriever'

export interface AnswerGroup {
  title: string
  url: string
  repo: string
  text: string
  /** cosine similarity of the best-matching chunk for this source (0–1) */
  score: number
}

export interface Answer {
  body: string
  sources: Array<{ title: string; url: string; repo: string }>
  /** One best-matching snippet per source, in score order (for clean rendering). */
  groups?: AnswerGroup[]
  empty: boolean
}

// Build a clean, cited answer: keep results above threshold, then collapse to the
// single best-matching snippet PER SOURCE (highest score first) so the answer
// reads as a short, grouped, cited response rather than a wall of mixed text.
export function buildAnswer(results: ScoredChunk[], opts: { minScore?: number } = {}): Answer {
  const minScore = opts.minScore ?? 0.35
  const kept = results
    .filter((r) => r.score >= minScore)
    .slice()
    .sort((a, b) => b.score - a.score)
  if (kept.length === 0) return { body: '', sources: [], groups: [], empty: true }

  const seen = new Set<string>()
  const groups: AnswerGroup[] = []
  for (const r of kept) {
    const key = r.url || r.id
    if (!seen.has(key)) {
      seen.add(key)
      groups.push({ title: r.title, url: r.url, repo: r.repo, text: r.text, score: r.score })
    }
  }

  const body = groups.map((g) => g.text).join('\n\n')
  const sources = groups.map((g) => ({ title: g.title, url: g.url, repo: g.repo }))
  return { body, sources, groups, empty: false }
}
