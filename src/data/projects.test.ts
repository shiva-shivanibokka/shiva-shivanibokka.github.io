import { projects, DOMAINS } from './projects'

test('auto-discovered projects are well-formed', () => {
  expect(projects.length).toBeGreaterThanOrEqual(10)
  for (const p of projects) {
    expect(p.slug).toMatch(/^[a-z0-9-]+$/)
    expect(p.title.length).toBeGreaterThan(0)
    expect(p.blurb.length).toBeGreaterThan(20)
    expect(p.tech.length).toBeGreaterThan(0)
    expect(p.url).toBe(`https://github.com/shiva-shivanibokka/${p.repo}`)
    expect(DOMAINS).toContain(p.domain)
  }
})

test('slugs are unique', () => {
  const slugs = projects.map((p) => p.slug)
  expect(new Set(slugs).size).toBe(slugs.length)
})
