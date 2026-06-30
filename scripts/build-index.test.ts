import { buildIndex } from './build-index'

test('buildIndex produces a valid index using injected fetch + embedder', async () => {
  const fakeFetch = async (repo: string) =>
    `# ${repo}\n\nThis project does cool AI things. ${'detail '.repeat(60)}`
  const fakeEmbed = async (texts: string[]) =>
    texts.map(() => Array.from({ length: 384 }, () => 0.1))

  const index = await buildIndex({ fetchReadme: fakeFetch, embed: fakeEmbed })

  expect(index.model).toBe('Xenova/all-MiniLM-L6-v2')
  expect(index.dim).toBe(384)
  expect(index.chunks.length).toBeGreaterThan(0)
  for (const c of index.chunks) {
    expect(c.embedding.length).toBe(384)
    expect(c.text.length).toBeGreaterThan(0)
  }
  // project chunks carry a real GitHub URL; an About chunk is included
  expect(index.chunks.some((c) => c.url.startsWith('https://github.com/shiva-shivanibokka'))).toBe(true)
  expect(index.chunks.some((c) => c.id.startsWith('about-'))).toBe(true)
})
