import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Domain, Project } from '../src/data/types'

// Auto-build the FULL project list from GitHub: every public repo that has a
// *detailed* README, with empty/stub repos, forks, archived, and infra/site/
// tracker repos filtered out. Runs at build time (and on the CI schedule), so
// improving a README or adding a new project makes it appear automatically;
// gutting one drops it. Writes src/data/projects.generated.ts.

const OWNER = 'shiva-shivanibokka'
const API = 'https://api.github.com'

// Repos that are infrastructure / site / trackers / profile — never shown as "projects".
const EXCLUDE = new Set(
  [
    'shiva-shivanibokka.github.io',
    'shiva-shivanibokka',
    'dsa-dojo',
    'mission-frontier',
    'build-log',
    'mission-control',
    'residency-dojo',
  ].map((s) => s.toLowerCase()),
)

// A README counts as "detailed" if it has real prose (not just a title/badges).
const MIN_README_CHARS = 500

function headers() {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-build' }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

interface Repo {
  name: string
  description: string | null
  fork: boolean
  archived: boolean
  language: string | null
  topics?: string[]
  pushed_at: string
}

async function listRepos(): Promise<Repo[]> {
  const all: Repo[] = []
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${API}/users/${OWNER}/repos?per_page=100&page=${page}&type=owner&sort=pushed`, { headers: headers() })
    if (!res.ok) {
      console.warn(`  repo list failed: ${res.status}`)
      break
    }
    const batch = (await res.json()) as Repo[]
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

async function fetchReadme(repo: string): Promise<string> {
  const res = await fetch(`${API}/repos/${OWNER}/${repo}/readme`, { headers: { ...headers(), Accept: 'application/vnd.github.raw' } })
  if (!res.ok) return ''
  return await res.text()
}

// Rough prose length of a README (strip badges, code, html, headings, links).
function proseLength(md: string): number {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

// First real paragraph of a README → fallback blurb when there's no repo description.
function firstParagraph(md: string): string {
  const clean = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^\s*#.*$/gm, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~|]/g, ' ')
  for (const para of clean.split(/\n\s*\n/)) {
    const t = para.replace(/\s+/g, ' ').trim()
    if (t.length > 40) return t.length > 240 ? t.slice(0, 237).trimEnd() + '…' : t
  }
  return ''
}

function prettyTitle(repo: string): string {
  return repo
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (/^[A-Z0-9]{2,}$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

function classify(repo: Repo): Domain {
  const hay = `${repo.name} ${(repo.topics || []).join(' ')} ${repo.description || ''}`.toLowerCase()
  const has = (...ks: string[]) => ks.some((k) => hay.includes(k))
  if (has('agent', 'react-loop', 'langgraph', 'mcp', 'autonomous')) return 'Agentic'
  if (has('rag', 'cag', 'llm', 'gpt', 'prompt', 'generative', 'genai', 'chatbot')) return 'LLMs & GenAI'
  if (has('nlp', 'text', 'language-model', 'ner', 'sentiment')) return 'NLP'
  if (has('cnn', 'transformer', 'deep', 'neural', 'vision', 'image', 'super-resolution', 'lstm', 'attention')) return 'Deep Learning'
  if (has('mlops', 'pipeline', 'serving', 'deploy', 'mlflow', 'retrain', 'monitoring')) return 'MLOps'
  if (has('system-design', 'feature-store', 'batch-inference', 'recommendation', 'ranking')) return 'ML System Design'
  if (has('regression', 'classification', 'xgboost', 'random-forest', 'ml-model', 'scikit')) return 'Classical ML'
  if (has('data', 'analytics', 'sql', 'eda', 'visualization', 'dashboard', 'tableau')) return 'Data Science'
  if (has('web', 'app', 'full-stack', 'fullstack', 'react', 'next', 'frontend')) return 'Full-Stack / Product'
  return 'Other'
}

function slugify(repo: string): string {
  return repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const outFile = path.resolve(here, '..', 'src', 'data', 'projects.generated.ts')

  const repos = await listRepos()
  console.log(`Found ${repos.length} repos for @${OWNER}`)

  const shown: Project[] = []
  let scanned = 0
  for (const r of repos) {
    const key = r.name.toLowerCase()
    if (r.fork || r.archived || EXCLUDE.has(key)) continue
    scanned++
    const readme = await fetchReadme(r.name)
    if (proseLength(readme) < MIN_README_CHARS) continue // skip empty / stub repos
    const blurb = (r.description && r.description.trim()) || firstParagraph(readme)
    if (blurb.length < 30) continue // no usable summary → skip
    const tech = [...new Set([...(r.topics || []), r.language].filter(Boolean))].slice(0, 5) as string[]
    shown.push({
      slug: slugify(r.name),
      title: prettyTitle(r.name),
      repo: r.name,
      domain: classify(r),
      blurb,
      tech: tech.length ? tech : ['Project'],
      url: `https://github.com/${OWNER}/${r.name}`,
    })
  }

  console.log(`  ${shown.length} shown (of ${scanned} scanned; rest filtered for thin/empty READMEs)`)

  const body =
    `import type { Project } from './types'\n\n` +
    `// AUTO-GENERATED by scripts/build-projects.ts — do not edit by hand.\n` +
    `// Every public repo with a detailed README (empty / stub repos filtered out).\n` +
    `export const generatedProjects: Project[] = ${JSON.stringify(shown, null, 2)}\n`
  await fs.writeFile(outFile, body)
  console.log(`Wrote ${shown.length} projects → src/data/projects.generated.ts`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
