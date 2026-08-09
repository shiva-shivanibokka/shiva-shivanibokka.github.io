import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Domain, Project } from '../src/data/types'
import { firstParagraph, proseLength } from '../src/rag/markdown'

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
  homepage: string | null
  topics?: string[]
  pushed_at: string
}

// A demo link is only worth showing if it still answers. These live on free
// tiers that expire, get suspended, or quietly stop building, so the repo's
// homepage field is treated as a claim to verify rather than a fact. Checked at
// build time, which the daily CI run repeats — a demo that dies drops off the
// site on its own, and comes back if it is redeployed.
const DEMO_TIMEOUT_MS = 12_000

async function checkLive(url: string): Promise<boolean> {
  // Two attempts: a single flaky request from CI should not silently strip a
  // link from every card. GET rather than HEAD — some static hosts reject HEAD,
  // and GET is what an actual visitor performs.
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctl = new AbortController()
    const timer = setTimeout(() => ctl.abort(), DEMO_TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': 'portfolio-build' } })
      if (res.ok) return true
    } catch {
      // network error, DNS failure or timeout — fall through and retry once
    } finally {
      clearTimeout(timer)
    }
  }
  return false
}

// Homepages that point back at this site or at the repo itself are not demos.
function demoCandidate(repo: string, homepage: string | null): string | null {
  const url = (homepage || '').trim()
  if (!/^https?:\/\//i.test(url)) return null
  if (/github\.com/i.test(url)) return null
  if (new RegExp(`${OWNER}\\.github\\.io/?$`, 'i').test(url)) return null
  return url
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

// GitHub returns 403/429 (or x-ratelimit-remaining: 0) when rate-limited. That is
// NOT the same as a genuine 404 "file absent": treating it as absent would silently
// drop real repos from the site. Detect it and hard-fail the build so we never emit
// a truncated project list.
function assertNotRateLimited(res: Response, what: string): void {
  if (res.status === 403 || res.status === 429 || res.headers.get('x-ratelimit-remaining') === '0') {
    throw new Error(`GitHub rate limit hit while fetching ${what}; aborting to avoid a truncated site`)
  }
}

async function fetchReadme(repo: string): Promise<string> {
  const res = await fetch(`${API}/repos/${OWNER}/${repo}/readme`, { headers: { ...headers(), Accept: 'application/vnd.github.raw' } })
  if (!res.ok) {
    assertNotRateLimited(res, `${repo}/readme`)
    return '' // genuine 404 → repo simply has no README
  }
  return await res.text()
}

// Raw contents of a file in the repo (default branch); '' if missing.
async function fetchFile(repo: string, path: string): Promise<string> {
  const res = await fetch(`${API}/repos/${OWNER}/${repo}/contents/${encodeURIComponent(path)}`, {
    headers: { ...headers(), Accept: 'application/vnd.github.raw' },
  })
  if (!res.ok) {
    assertNotRateLimited(res, `${repo}/${path}`)
    return '' // genuine 404 → file absent
  }
  return await res.text()
}

// Dependency manifests → the real imported libraries, for precise tech detection.
async function fetchManifests(repo: string): Promise<string> {
  const files = ['requirements.txt', 'pyproject.toml', 'environment.yml', 'package.json']
  const texts = await Promise.all(files.map((f) => fetchFile(repo, f)))
  return texts.join('\n')
}

// All languages GitHub detected in the repo, most-used first — authoritative tech.
async function fetchLanguages(repo: string): Promise<string[]> {
  const res = await fetch(`${API}/repos/${OWNER}/${repo}/languages`, { headers: headers() })
  if (!res.ok) {
    assertNotRateLimited(res, `${repo}/languages`)
    return []
  }
  const j = (await res.json()) as Record<string, number>
  return Object.entries(j)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
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

// Whole-word-ish keyword match so short tokens (rag, mcp, lora) don't match
// inside other words (e.g. "storage").
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
function hit(hay: string, kw: string): boolean {
  return new RegExp(`(^|[^a-z0-9+#.])${escapeRe(kw)}([^a-z0-9+#.]|$)`, 'i').test(hay)
}

// Tech stack — canonical name → keywords to find in README/topics/languages/
// dependency manifests. Keep keywords distinctive so they don't match inside
// other words. Detected against a haystack that includes requirements.txt,
// pyproject.toml, environment.yml and package.json, so real imports get caught.
const TECH: [string, string[]][] = [
  // Deep learning / ML frameworks
  ['PyTorch', ['pytorch', 'torch']],
  ['TensorFlow', ['tensorflow']],
  ['Keras', ['keras']],
  ['JAX', ['jax', 'flax']],
  ['scikit-learn', ['scikit-learn', 'sklearn']],
  ['XGBoost', ['xgboost']],
  ['CatBoost', ['catboost']],
  ['LightGBM', ['lightgbm']],
  ['statsmodels', ['statsmodels']],
  ['SciPy', ['scipy']],
  ['ONNX', ['onnx']],
  ['OpenCV', ['opencv', 'cv2']],
  // LLM / GenAI / agents
  ['Transformers', ['transformers', 'huggingface', 'hugging face']],
  ['sentence-transformers', ['sentence-transformers', 'sentence transformer']],
  ['PEFT', ['peft']],
  ['TRL', ['trl']],
  ['bitsandbytes', ['bitsandbytes']],
  ['vLLM', ['vllm']],
  ['LangGraph', ['langgraph']],
  ['LangChain', ['langchain']],
  ['LlamaIndex', ['llamaindex', 'llama-index', 'llama index']],
  ['RAG', ['rag', 'retrieval-augmented', 'retrieval augmented']],
  ['FAISS', ['faiss']],
  ['ChromaDB', ['chromadb', 'chroma']],
  ['Pinecone', ['pinecone']],
  ['Weaviate', ['weaviate']],
  ['Qdrant', ['qdrant']],
  ['LoRA', ['lora', 'qlora']],
  ['MCP', ['mcp', 'model context protocol']],
  ['OpenAI', ['openai', 'gpt-4', 'gpt-4o']],
  ['Anthropic', ['anthropic', 'claude']],
  ['Gemini', ['gemini', 'google generativeai']],
  ['Groq', ['groq']],
  ['Cohere', ['cohere']],
  ['Ollama', ['ollama']],
  ['spaCy', ['spacy']],
  ['NLTK', ['nltk']],
  ['DeBERTa', ['deberta']],
  // Data / analytics
  ['NumPy', ['numpy']],
  ['pandas', ['pandas']],
  ['Polars', ['polars']],
  ['DuckDB', ['duckdb']],
  ['Matplotlib', ['matplotlib']],
  ['Seaborn', ['seaborn']],
  ['Plotly', ['plotly']],
  ['PySpark', ['pyspark', 'apache spark']],
  ['Airflow', ['airflow']],
  ['dbt', ['dbt-core', 'dbt run']],
  ['Kafka', ['kafka']],
  ['Tableau', ['tableau']],
  ['Power BI', ['power bi', 'powerbi']],
  // Backend / APIs / data stores
  ['FastAPI', ['fastapi']],
  ['Flask', ['flask']],
  ['Django', ['django']],
  ['uvicorn', ['uvicorn']],
  ['Pydantic', ['pydantic']],
  ['SQLAlchemy', ['sqlalchemy']],
  ['Node.js', ['node.js', 'nodejs']],
  ['Express', ['express']],
  ['GraphQL', ['graphql']],
  ['Prisma', ['prisma']],
  ['Postgres', ['postgres', 'postgresql', 'psycopg', 'asyncpg']],
  ['MySQL', ['mysql', 'aiomysql']],
  ['MongoDB', ['mongodb', 'pymongo']],
  ['Redis', ['redis']],
  ['Celery', ['celery']],
  ['Supabase', ['supabase']],
  // Frontend
  ['React', ['react']],
  ['Next.js', ['next.js', 'nextjs']],
  ['Vue', ['vue']],
  ['Svelte', ['svelte', 'sveltekit']],
  ['Tailwind', ['tailwind']],
  ['Vite', ['vite']],
  ['Framer Motion', ['framer-motion', 'framer motion']],
  ['shadcn/ui', ['shadcn']],
  ['Radix UI', ['radix-ui', '@radix']],
  ['Material UI', ['@mui', 'material-ui', 'material ui']],
  ['Chakra UI', ['chakra-ui', 'chakra ui']],
  ['Bootstrap', ['bootstrap']],
  ['styled-components', ['styled-components']],
  ['Redux', ['redux']],
  ['Zustand', ['zustand']],
  ['TanStack Query', ['tanstack', 'react-query', 'react query']],
  ['Three.js', ['three.js', 'threejs']],
  ['D3.js', ['d3.js', 'd3-']],
  ['Chart.js', ['chart.js', 'chartjs']],
  ['Recharts', ['recharts']],
  ['Axios', ['axios']],
  ['Zod', ['zod']],
  ['Vercel', ['vercel']],
  ['Netlify', ['netlify']],
  // Serving / demos
  ['Streamlit', ['streamlit']],
  ['Gradio', ['gradio']],
  // MLOps / infra / cloud / testing
  ['Docker', ['docker', 'docker-compose']],
  ['Kubernetes', ['kubernetes', 'k8s']],
  ['Terraform', ['terraform']],
  ['GitHub Actions', ['github actions', 'github-actions']],
  ['MLflow', ['mlflow']],
  ['Weights & Biases', ['wandb', 'weights & biases', 'weights and biases']],
  ['DVC', ['dvc']],
  ['Optuna', ['optuna']],
  ['Ray', ['ray tune', 'ray[']],
  ['pytest', ['pytest']],
  ['AWS', ['aws', 'sagemaker', 'boto3']],
  ['GCP', ['gcp', 'google cloud', 'bigquery', 'vertex ai']],
  ['Azure', ['azure']],
  ['Playwright', ['playwright']],
  ['BeautifulSoup', ['beautifulsoup', 'bs4']],
]
const SKIP_LANG = new Set(['html', 'css', 'scss', 'dockerfile', 'makefile', 'shell', 'batchfile', 'procfile', 'roff'])

function detectTech(hay: string, langs: string[]): string[] {
  const cleanLangs = langs.filter((l) => !SKIP_LANG.has(l.toLowerCase())).slice(0, 3)
  const frameworks = TECH.filter(([, kws]) => kws.some((k) => hit(hay, k))).map(([name]) => name)
  return [...new Set([...cleanLangs, ...frameworks])].slice(0, 14)
}

// Domain by WEIGHTED keyword score over README + topics + description + languages.
// [domain, strong markers (×3), weak markers (×1)]. Strong = distinctive to that
// domain; weak = broad terms that show up across many ML repos. Earlier domains
// win ties (most specific first); 'Other' only when there's no signal at all.
const DOMAIN_KW: [Domain, string[], string[]][] = [
  ['Agentic', ['langgraph', 'mcp', 'model context protocol', 'multi-agent', 'agentic', 'react loop', 'tool registry', 'autonomous agent'], ['agent', 'tool-calling', 'planner']],
  ['LLMs & GenAI', ['rag', 'cag', 'retrieval-augmented', 'fine-tuning', 'fine-tune', 'lora', 'qlora', 'dpo', 'prompt engineering'], ['llm', 'gpt', 'prompt', 'generative', 'genai', 'chatbot', 'embedding', 'embeddings', 'openai', 'anthropic', 'langchain', 'llama', 'mistral']],
  ['NLP', ['named entity', 'ner', 'entailment', 'hallucination', 'tokenizer', 'sentiment analysis'], ['nlp', 'sentiment', 'spacy', 'summarization', 'text classification']],
  ['Deep Learning', ['cnn', 'super-resolution', 'autograd', 'backprop', 'lstm', 'temporal fusion', 'patchtst'], ['pytorch', 'tensorflow', 'keras', 'transformer', 'neural network', 'deep learning', 'rnn', 'attention', 'gan']],
  ['ML System Design', ['feature store', 'feature-store', 'batch inference', 'batch-inference', 'model serving', 'model-serving', 'retraining pipeline', 'retraining-pipeline', 'system design', 'system-design', 'recommendation-engine'], ['recommendation', 'ranking', 'scalable']],
  ['MLOps', ['mlflow', 'ci/cd', 'model registry', 'kubernetes', 'drift detection'], ['mlops', 'monitoring', 'drift', 'deployment pipeline', 'docker-compose']],
  ['Classical ML', ['xgboost', 'catboost', 'random forest', 'gradient boosting', 'k-means'], ['regression', 'classification', 'svm', 'clustering', 'scikit-learn', 'sklearn', 'feature engineering']],
  ['Data Science', ['exploratory data analysis', 'eda', 'tableau', 'power bi'], ['data analysis', 'visualization', 'dashboard', 'statistics', 'hypothesis', 'pandas']],
  ['Full-Stack / Product', ['full-stack', 'fullstack', 'next.js', 'saas'], ['web app', 'frontend', 'react app', 'user interface']],
]

function classify(hay: string): Domain {
  let best: Domain = 'Other'
  let bestScore = 0
  for (const [domain, strong, weak] of DOMAIN_KW) {
    const score = 3 * strong.filter((k) => hit(hay, k)).length + weak.filter((k) => hit(hay, k)).length
    if (score > bestScore) {
      bestScore = score
      best = domain
    }
  }
  return best
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
  const dead: string[] = []
  let scanned = 0
  let live = 0
  for (const r of repos) {
    const key = r.name.toLowerCase()
    if (r.fork || r.archived || EXCLUDE.has(key)) continue
    scanned++
    const readme = await fetchReadme(r.name)
    if (proseLength(readme) < MIN_README_CHARS) continue // skip empty / stub repos
    const blurb = (r.description && r.description.trim()) || firstParagraph(readme)
    if (blurb.length < 30) continue // no usable summary → skip
    // Detect tech + domain from README + topics + description + real repo
    // languages + dependency manifests (the actual imported libraries).
    const langs = await fetchLanguages(r.name)
    const manifests = await fetchManifests(r.name)
    const hay = `${r.name} ${(r.topics || []).join(' ')} ${r.description || ''} ${langs.join(' ')} ${readme}\n${manifests}`.toLowerCase()
    const tech = detectTech(hay, langs)
    const candidate = demoCandidate(r.name, r.homepage)
    let demo: string | undefined
    if (candidate) {
      if (await checkLive(candidate)) {
        demo = candidate
        live++
      } else {
        dead.push(`${r.name} → ${candidate}`)
      }
    }
    shown.push({
      slug: slugify(r.name),
      title: prettyTitle(r.name),
      repo: r.name,
      domain: classify(hay),
      blurb,
      tech: tech.length ? tech : ['Project'],
      url: `https://github.com/${OWNER}/${r.name}`,
      ...(demo ? { demo } : {}),
    })
  }

  console.log(`  ${shown.length} shown (of ${scanned} scanned; rest filtered for thin/empty READMEs)`)
  console.log(`  ${live} live demos linked`)
  // Never drop a demo silently — an unreachable one is a thing to go fix.
  if (dead.length) console.warn(`  ${dead.length} demo(s) unreachable, link omitted:\n    ${dead.join('\n    ')}`)

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
