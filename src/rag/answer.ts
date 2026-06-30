import type { ScoredChunk } from './retriever'

export interface Answer {
  body: string
  sources: Array<{ title: string; url: string; repo: string }>
  empty: boolean
}

export function buildAnswer(results: ScoredChunk[], opts: { minScore?: number } = {}): Answer {
  const minScore = opts.minScore ?? 0.25
  const kept = results.filter((r) => r.score >= minScore)
  if (kept.length === 0) return { body: '', sources: [], empty: true }

  const body = kept.map((r) => r.text).join('\n\n')

  const seen = new Set<string>()
  const sources: Answer['sources'] = []
  for (const r of kept) {
    if (r.url && !seen.has(r.url)) {
      seen.add(r.url)
      sources.push({ title: r.title, url: r.url, repo: r.repo })
    }
  }
  return { body, sources, empty: false }
}
