import { chunkText } from './chunk'

test('returns one chunk for short text', () => {
  expect(chunkText('hello world')).toEqual(['hello world'])
})

test('splits long text into multiple bounded chunks', () => {
  const para = 'x'.repeat(800)
  const text = [para, para, para].join('\n\n')
  const chunks = chunkText(text, { maxChars: 1000, overlap: 0 })
  expect(chunks.length).toBeGreaterThan(1)
  for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1000)
})

test('drops empty chunks and trims', () => {
  const chunks = chunkText('\n\n   \n\nreal content\n\n   ')
  expect(chunks).toEqual(['real content'])
})

test('applies overlap between consecutive chunks', () => {
  const a = 'A'.repeat(600)
  const b = 'B'.repeat(600)
  const chunks = chunkText([a, b].join('\n\n'), { maxChars: 700, overlap: 100 })
  expect(chunks.length).toBe(2)
  expect(chunks[1].startsWith('A'.repeat(50))).toBe(true)
})
