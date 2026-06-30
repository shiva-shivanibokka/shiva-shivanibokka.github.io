import { cosineSim, topK } from './retriever'
import type { SearchIndex } from './indexTypes'

test('cosineSim of identical vectors is 1', () => {
  expect(cosineSim([1, 0, 0], [1, 0, 0])).toBeCloseTo(1)
})

test('cosineSim of orthogonal vectors is 0', () => {
  expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0)
})

test('topK returns the closest chunks in descending score order', () => {
  const index: SearchIndex = {
    model: 'm', dim: 2,
    chunks: [
      { id: 'a', repo: 'A', domain: 'Agentic', title: 'A', url: 'u', text: 'a', embedding: [1, 0] },
      { id: 'b', repo: 'B', domain: 'Agentic', title: 'B', url: 'u', text: 'b', embedding: [0, 1] },
      { id: 'c', repo: 'C', domain: 'Agentic', title: 'C', url: 'u', text: 'c', embedding: [0.9, 0.1] },
    ],
  }
  const out = topK(index, [1, 0], 2)
  expect(out.map((c) => c.id)).toEqual(['a', 'c'])
  expect(out[0].score).toBeGreaterThanOrEqual(out[1].score)
})
