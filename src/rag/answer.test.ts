import { buildAnswer } from './answer'
import type { ScoredChunk } from './retriever'

const mk = (over: Partial<ScoredChunk>): ScoredChunk => ({
  id: 'x', repo: 'R', domain: 'Agentic', title: 'T', url: 'https://u', text: 'text', embedding: [], score: 0.9, ...over,
})

test('returns empty answer when nothing clears threshold', () => {
  const ans = buildAnswer([mk({ score: 0.1 })], { minScore: 0.25 })
  expect(ans.empty).toBe(true)
})

test('assembles body and dedupes sources by url', () => {
  const ans = buildAnswer([
    mk({ id: '1', text: 'first', url: 'https://a', title: 'A' }),
    mk({ id: '2', text: 'second', url: 'https://a', title: 'A' }),
    mk({ id: '3', text: 'third', url: 'https://b', title: 'B' }),
  ])
  expect(ans.empty).toBe(false)
  expect(ans.body).toContain('first')
  expect(ans.body).toContain('third')
  expect(ans.sources).toHaveLength(2)
  expect(ans.sources.map((s) => s.url)).toEqual(['https://a', 'https://b'])
})
