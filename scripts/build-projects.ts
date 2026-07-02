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

// Raw contents of a file in the repo (default branch); '' if missing.
async function fetchFile(repo: string, path: string): Promise<string> {
  const res = await fetch(`${API}/repos/${OWNER}/${repo}/contents/${encodeURIComponent(path)}`, {
    headers: { ...headers(), Accept: 'application/vnd.github.raw' },
  })
  if (!res.ok) return ''
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
  if (!res.ok) return []
  const j = (await res.json()) as Record<string, number>
  return Object.entries(j)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
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
  // Drop a leading YAML front-matter block (e.g. Hugging Face Spaces configs:
  // ---\n title: … sdk: … \n--- ) so it never leaks into the blurb.
  const noFrontmatter = md.replace(/^﻿?\s*---\r?\n[\s\S]*?\r?\n---\s*/, ' ')
  const clean = noFrontmatter
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
  let scanned = 0
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
    shown.push({
      slug: slugify(r.name),
      title: prettyTitle(r.name),
      repo: r.name,
      domain: classify(hay),
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
