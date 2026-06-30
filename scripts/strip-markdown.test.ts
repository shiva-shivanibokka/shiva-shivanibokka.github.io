import { stripMarkdown } from './build-index'

test('removes badges, links, tables, and headings', () => {
  const md = `# Title\n\n[![CI](https://x/badge.svg)](https://x/ci)\n\nSee the [live demo](https://demo.app) here.\n\n| ID | Cat |\n|----|-----|\n| Q1 | factual |\n\n## Section\nReal **prose** content.`
  const out = stripMarkdown(md)
  expect(out).not.toMatch(/!\[/)
  expect(out).not.toMatch(/badge\.svg/)
  expect(out).not.toMatch(/https?:\/\//)
  expect(out).not.toContain('|')
  expect(out).not.toMatch(/##/)
  expect(out).toContain('live demo')   // link text kept
  expect(out).toContain('Real prose content')
})
