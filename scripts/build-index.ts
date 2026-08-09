import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { writeIndex } from './indexFiles'
import { chunkText } from '../src/rag/chunk'
import { projects } from '../src/data/projects'
import { EMBED_DIM, EMBED_MODEL, type IndexChunk, type SearchIndex } from '../src/rag/indexTypes'
import { stripMarkdown } from '../src/rag/markdown'
import { buildMap } from './build-map'

// Re-exported from the shared markdown utility so existing importers (and the
// strip-markdown test) keep working after the pipeline moved to src/rag/markdown.ts.
export { stripMarkdown }

const OWNER = 'shiva-shivanibokka'

// Fetch a repo's README live from GitHub (default branch). Returns '' if none/404.
// Uses Node's global fetch (Node 20+). Unauthenticated; raw README endpoint.
async function fetchReadmeFromGitHub(repo: string): Promise<string> {
  const url = `https://api.github.com/repos/${OWNER}/${repo}/readme`
  const headers: Record<string, string> = { Accept: 'application/vnd.github.raw' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    console.warn(`  README fetch failed for ${repo}: ${res.status}`)
    return ''
  }
  return await res.text()
}

export async function buildIndex(opts: {
  fetchReadme: (repo: string) => Promise<string>
  embed: (texts: string[]) => Promise<number[][]>
}): Promise<SearchIndex> {
  const { fetchReadme, embed } = opts
  const chunks: Omit<IndexChunk, 'embedding'>[] = []

  // Per-project corpus ONLY: the live GitHub README + the project blurb.
  // The About/profile README is intentionally NOT embedded — the RAG answers
  // about projects, and including the bio added noise + off-topic matches.
  for (const p of projects) {
    const readme = stripMarkdown(await fetchReadme(p.repo))
    const corpus = [`# ${p.title}\n${p.blurb}`, readme].filter(Boolean).join('\n\n')
    chunkText(corpus).forEach((text, i) => {
      chunks.push({ id: `${p.slug}-${i}`, repo: p.repo, domain: p.domain, title: p.title, url: p.url, text })
    })
  }

  const embeddings = await embed(chunks.map((c) => c.text))
  return {
    model: EMBED_MODEL,
    dim: EMBED_DIM,
    chunks: chunks.map((c, i) => ({ ...c, embedding: embeddings[i] })),
  }
}

// Real embedder using transformers.js (Node). Only imported when run as a script.
async function realEmbed(texts: string[]): Promise<number[][]> {
  const { pipeline } = await import('@xenova/transformers')
  const extractor = await pipeline('feature-extraction', EMBED_MODEL)
  const out: number[][] = []
  for (const t of texts) {
    const res = await extractor(t, { pooling: 'mean', normalize: true })
    out.push(Array.from(res.data as Float32Array))
  }
  return out
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const projectRoot = path.resolve(here, '..')
  const index = await buildIndex({ fetchReadme: fetchReadmeFromGitHub, embed: realEmbed })
  const outDir = path.join(projectRoot, 'public')
  await fs.mkdir(outDir, { recursive: true })
  const { metaBytes, vecBytes } = await writeIndex(outDir, index)
  // Content signature over chunk TEXT only (not embeddings) so the scheduled
  // rebuild can detect real README changes without false positives from any
  // floating-point nondeterminism in the embeddings. Task 12's deploy gate diffs this file.
  const sig = createHash('sha256')
    .update(index.chunks.map((c) => `${c.id} ${c.text}`).sort().join(''))
    .digest('hex')
  await fs.writeFile(path.join(outDir, 'corpus.sig'), sig + '\n')
  console.log(
    `Wrote ${index.chunks.length} chunks: ${(metaBytes / 1048576).toFixed(2)} MB meta + ` +
      `${(vecBytes / 1048576).toFixed(2)} MB vectors (sig ${sig.slice(0, 12)})`,
  )
  // 2D PCA projection of repo embeddings → the interactive map background.
  const map = buildMap(index)
  await fs.writeFile(path.join(outDir, 'embedding-map.json'), JSON.stringify(map))
  console.log(`Wrote ${map.length} repo nodes to public/embedding-map.json`)
}

// Run main() only when executed directly, not when imported by the test.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (invokedDirectly) main().catch((e) => { console.error(e); process.exit(1) })
