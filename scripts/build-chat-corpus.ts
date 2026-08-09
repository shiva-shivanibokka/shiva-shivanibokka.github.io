import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generatedProjects } from '../src/data/projects.generated'
import { bio, experience, links } from '../src/data/content'
import type { SearchIndex } from '../src/rag/indexTypes'

// The chatbot's source of truth, and deliberately NOT search-index.json.
//
// Two reasons. First, size: the search index carries a 384-float embedding on
// every one of ~700 chunks, which the Worker has no use for — it never embeds
// anything, the browser does that. Stripping the vectors takes it from megabytes
// to a few hundred KB. Second, and more important, trust: the browser sends the
// Worker chunk *ids*, never chunk text. The Worker resolves those ids against
// this file, which it fetches itself. So every token of context the model sees
// comes from Shivani's own repos, and a hand-crafted request cannot smuggle in
// arbitrary text and turn the endpoint into a general-purpose LLM proxy.

interface ChatChunk {
  repo: string
  title: string
  url: string
  text: string
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const root = path.resolve(here, '..')
  const index: SearchIndex = JSON.parse(await fs.readFile(path.join(root, 'public', 'search-index.json'), 'utf-8'))

  const chunks: Record<string, ChatChunk> = {}
  for (const c of index.chunks) {
    chunks[c.id] = { repo: c.repo, title: c.title, url: c.url, text: c.text }
  }

  // The catalog is small enough to send on EVERY turn, which is what makes
  // "what AI projects has she built?" answerable completely rather than from
  // whatever four chunks happened to rank highest. Breadth comes from here;
  // depth comes from the retrieved chunks.
  const catalog = generatedProjects.map((p) => ({
    title: p.title,
    repo: p.repo,
    domain: p.domain,
    blurb: p.blurb,
    tech: p.tech,
    url: p.url,
    ...(p.demo ? { demo: p.demo } : {}),
  }))

  const out = {
    generated: new Date().toISOString(),
    bio,
    contact: links.filter((l) => l.url.startsWith('mailto:') || l.url.startsWith('http')),
    experience: experience.map((e) => ({ role: e.role, org: e.org, period: e.period, bullets: e.bullets })),
    catalog,
    chunks,
  }

  const file = path.join(root, 'public', 'chat-corpus.json')
  await fs.writeFile(file, JSON.stringify(out))
  const kb = (await fs.stat(file)).size / 1024
  console.log(`chat-corpus.json: ${catalog.length} projects, ${Object.keys(chunks).length} chunks, ${kb.toFixed(0)} KB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
