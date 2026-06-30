import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SearchIndex } from '../src/rag/indexTypes'

// A 2D point for one repo, projected from its mean README embedding via PCA.
export interface MapNode {
  repo: string
  title: string
  domain: string
  x: number // normalized 0–1
  y: number // normalized 0–1
}

function meanVec(vs: number[][]): number[] {
  const d = vs[0].length
  const m = new Array(d).fill(0)
  for (const v of vs) for (let i = 0; i < d; i++) m[i] += v[i]
  for (let i = 0; i < d; i++) m[i] /= vs.length
  return m
}
const sub = (a: number[], b: number[]) => a.map((x, i) => x - b[i])
const dot = (a: number[], b: number[]) => {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}
const unit = (a: number[]) => {
  const n = Math.sqrt(dot(a, a)) || 1
  return a.map((x) => x / n)
}

// Leading principal component via power iteration over the centered data rows.
function principalComponent(rows: number[][], iters = 100): number[] {
  const d = rows[0].length
  let v = unit(Array.from({ length: d }, (_, i) => Math.sin(i * 12.9898 + 1))) // deterministic seed
  for (let it = 0; it < iters; it++) {
    const acc = new Array(d).fill(0)
    for (const r of rows) {
      const p = dot(r, v)
      for (let i = 0; i < d; i++) acc[i] += p * r[i]
    }
    v = unit(acc)
  }
  return v
}

const normalize01 = (a: number[]): number[] => {
  const mn = Math.min(...a)
  const mx = Math.max(...a)
  const rng = mx - mn || 1
  return a.map((x) => (x - mn) / rng)
}

export function buildMap(index: SearchIndex): MapNode[] {
  const byRepo = new Map<string, { title: string; domain: string; vecs: number[][] }>()
  for (const c of index.chunks) {
    if (!c.repo) continue
    if (!byRepo.has(c.repo)) byRepo.set(c.repo, { title: c.title, domain: c.domain, vecs: [] })
    byRepo.get(c.repo)!.vecs.push(c.embedding)
  }
  const repos = [...byRepo.entries()].map(([repo, o]) => ({
    repo,
    title: o.title,
    domain: o.domain,
    vec: meanVec(o.vecs),
  }))
  if (repos.length < 2) return repos.map((r) => ({ repo: r.repo, title: r.title, domain: r.domain, x: 0.5, y: 0.5 }))

  const gmean = meanVec(repos.map((r) => r.vec))
  const rows = repos.map((r) => sub(r.vec, gmean))
  const pc1 = principalComponent(rows)
  const rows2 = rows.map((r) => {
    const p = dot(r, pc1)
    return r.map((x, i) => x - p * pc1[i])
  })
  const pc2 = principalComponent(rows2)

  const xs = normalize01(rows.map((r) => dot(r, pc1)))
  const ys = normalize01(rows.map((r) => dot(r, pc2)))
  return repos.map((r, i) => ({ repo: r.repo, title: r.title, domain: r.domain, x: xs[i], y: ys[i] }))
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const root = path.resolve(here, '..')
  const idx: SearchIndex = JSON.parse(await fs.readFile(path.join(root, 'public', 'search-index.json'), 'utf8'))
  const map = buildMap(idx)
  await fs.writeFile(path.join(root, 'public', 'embedding-map.json'), JSON.stringify(map))
  console.log(`Wrote embedding-map.json with ${map.length} repo nodes`)
}

const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (invokedDirectly) main().catch((e) => { console.error(e); process.exit(1) })
