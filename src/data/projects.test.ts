import { projects, DOMAINS } from './projects'

test('has 20-32 curated projects, all well-formed', () => {
  expect(projects.length).toBeGreaterThanOrEqual(20)
  expect(projects.length).toBeLessThanOrEqual(32)
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

test('every domain has at least one project', () => {
  for (const d of DOMAINS) {
    expect(projects.some((p) => p.domain === d)).toBe(true)
  }
})
