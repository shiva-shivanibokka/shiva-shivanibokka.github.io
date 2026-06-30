# "Ask My Work" AI/ML Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dark, premium personal portfolio whose hero is a real, in-browser extractive RAG bot that answers questions about Shivani's repos with citations, deployed free to GitHub Pages.

**Architecture:** A Vite + React + TypeScript SPA styled with Tailwind. A build-time Node script reads curated repo READMEs + `About_Me.md` (+ optional `WHAT AND WHY` write-ups), chunks them, embeds each chunk with `all-MiniLM-L6-v2` via transformers.js, and emits `public/search-index.json`. At runtime the browser lazy-loads that index and the same model, embeds the visitor's query, does cosine-similarity top-k retrieval, and renders a cited extractive answer. All other sections are static, data-driven React components.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v3, framer-motion, `@xenova/transformers`, Vitest + @testing-library/react, GitHub Actions → GitHub Pages.

## Global Constraints

- Node 20+; package manager: npm.
- Repo name MUST be `shiva-shivanibokka.github.io` (GitHub user-site, served at root → Vite `base: '/'`).
- No backend, no API keys, no paid services. RAG runs 100% client-side.
- Phase 1: extractive retrieval only (no generative LLM).
- Embedding model is `Xenova/all-MiniLM-L6-v2`, 384-dim, used identically at build time and runtime.
- Palette tokens (exact): base `#14131A`, surface `#1C1B24`, text `#ECE6DD`, muted `#9A93A6`, primary `#7C6CF0`, warm `#FF8A6B`. Body text is warm-ivory `#ECE6DD`, never pure white.
- All motion must respect `prefers-reduced-motion`. Target WCAG AA contrast.
- GitHub username/links use `shiva-shivanibokka`. Contact: shivani.bokka93@gmail.com, LinkedIn `shivani-bokka`.
- Corpus source: repo `README.md` (primary) + root `About_Me.md`. (The `WHAT AND WHY` write-ups are intentionally NOT used in Phase 1 — they will be authored for all projects later, then added as a corpus source.) Repo source root: `..` relative to project (the `GITHUB REPOS` parent).

---

### Task 1: Project scaffold, theme, and test runner

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `postcss.config.js`, `tailwind.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `.gitignore`
- Test: `src/setupTests.ts`, `src/App.test.tsx`

**Interfaces:**
- Produces: a running Vite React app; Tailwind theme exposing colors `base/surface/text/muted/primary/warm`; Vitest configured with jsdom; `App` default export rendering a landmark `<main>`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "shiva-shivanibokka.github.io",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "npm run build:index && tsc -b && vite build",
    "build:index": "tsx scripts/build-index.ts",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@xenova/transformers": "^2.17.2",
    "framer-motion": "^11.3.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.6",
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "jsdom": "^24.1.0",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "tsx": "^4.16.2",
    "typescript": "^5.5.3",
    "vite": "^5.3.4",
    "vitest": "^2.0.3"
  }
}
```

- [ ] **Step 2: Create config files**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
} as any)
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "scripts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

`postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

`tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#14131A',
        surface: '#1C1B24',
        text: '#ECE6DD',
        muted: '#9A93A6',
        primary: '#7C6CF0',
        warm: '#FF8A6B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
```

`.gitignore`:
```
node_modules
dist
*.local
.DS_Store
```

- [ ] **Step 3: Create entry files**

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Shivani Bokka — AI/ML Engineer</title>
    <meta name="description" content="AI/ML engineer. Ask my portfolio anything — a real in-browser RAG over my work." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:
```ts
/// <reference types="vite/client" />
```

`src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: dark; }
html { scroll-behavior: smooth; }
body { @apply bg-base text-text font-sans antialiased; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

`src/main.tsx`:
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <main className="min-h-screen bg-base text-text">
      <h1 className="sr-only">Shivani Bokka — AI/ML Engineer</h1>
    </main>
  )
}
```

`src/setupTests.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Write the failing test**

`src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders a main landmark with the name heading', () => {
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /Shivani Bokka/i })).toBeInTheDocument()
})
```

- [ ] **Step 5: Install and run the test**

Run: `npm install && npm test`
Expected: PASS (1 test).

- [ ] **Step 6: Verify dev server boots**

Run: `npm run build`
Note: `build:index` will fail until Task 4 exists. For THIS task only, verify the app compiles with: `npx tsc -b && npx vite build`
Expected: `dist/` produced, no type errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite+React+TS+Tailwind portfolio with theme tokens and tests"
```

---

### Task 2: Project data model and curated repo metadata

**Files:**
- Create: `src/data/types.ts`, `src/data/projects.ts`
- Test: `src/data/projects.test.ts`

**Interfaces:**
- Produces:
  - `type Domain = 'Agentic' | 'LLMs & GenAI' | 'Deep Learning' | 'Classical ML' | 'ML System Design' | 'MLOps' | 'Data Science' | 'Visualization' | 'CS/DSA'`
  - `interface Project { slug: string; title: string; repo: string; domain: Domain; blurb: string; tech: string[]; metrics?: string[]; url: string }`
  - `const projects: Project[]` (the curated ~20)
  - `const DOMAINS: Domain[]` (ordered, for filter UI)

- [ ] **Step 1: Write the failing test**

`src/data/projects.test.ts`:
```ts
import { projects, DOMAINS } from './projects'

test('has 15-22 curated projects, all well-formed', () => {
  expect(projects.length).toBeGreaterThanOrEqual(15)
  expect(projects.length).toBeLessThanOrEqual(22)
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- projects`
Expected: FAIL (cannot find `./projects`).

- [ ] **Step 3: Create `src/data/types.ts`**

```ts
export type Domain =
  | 'Agentic'
  | 'LLMs & GenAI'
  | 'Deep Learning'
  | 'Classical ML'
  | 'ML System Design'
  | 'MLOps'
  | 'Data Science'
  | 'Visualization'
  | 'CS/DSA'

export interface Project {
  slug: string
  title: string
  repo: string
  domain: Domain
  blurb: string
  tech: string[]
  metrics?: string[]
  url: string
}
```

- [ ] **Step 4: Create `src/data/projects.ts`**

> Implementer note: blurbs/tech/metrics below are drawn from `About_Me.md` and the repo READMEs. If a README reveals a sharper metric, refine the string — but keep the shape. `url` is always `https://github.com/shiva-shivanibokka/<repo>`.

```ts
import type { Domain, Project } from './types'

export const DOMAINS: Domain[] = [
  'Agentic',
  'LLMs & GenAI',
  'Deep Learning',
  'Classical ML',
  'ML System Design',
  'MLOps',
  'Data Science',
  'Visualization',
  'CS/DSA',
]

const gh = (repo: string) => `https://github.com/shiva-shivanibokka/${repo}`

const raw: Omit<Project, 'url'>[] = [
  { slug: 'autonomous-swe-agent', title: 'Autonomous SWE Agent', repo: 'Autonomous-SWE-Agent', domain: 'Agentic',
    blurb: 'A ReAct-style coding agent that plans, edits, and runs code through a typed tool registry with error short-circuiting.',
    tech: ['Python', 'LangGraph', 'ReAct', 'MCP'], metrics: ['50-tool typed registry'] },
  { slug: 'autoapply-job-agent', title: 'AutoApply Job Agent', repo: 'AutoApply-Job-Agent', domain: 'Agentic',
    blurb: 'An agent that scrapes postings, matches them to a resume, and drafts tailored applications end to end.',
    tech: ['Python', 'LLMs', 'Playwright', 'Pydantic'] },
  { slug: 'autonomous-research-report-agent', title: 'Autonomous Research Report Agent', repo: 'Autonomous-Research-Report-Agent', domain: 'Agentic',
    blurb: 'Multi-step research agent that searches the web, reads sources, and synthesizes a cited report.',
    tech: ['Python', 'Tavily', 'LangGraph', 'LLMs'] },
  { slug: 'autonomous-ml-pipeline-builder', title: 'Autonomous ML Pipeline Builder', repo: 'Autonomous-ML-Pipeline-Builder', domain: 'Agentic',
    blurb: 'Agent that constructs and runs end-to-end ML pipelines from a dataset and a goal description.',
    tech: ['Python', 'scikit-learn', 'LLMs'] },
  { slug: 'codepilot-agent', title: 'CodePilot Agent', repo: 'CodePilot-Agent', domain: 'Agentic',
    blurb: 'A coding copilot agent with sliding-window memory compression and tool-result TTL caching.',
    tech: ['Python', 'LLMs', 'MCP'] },
  { slug: 'scm-mcp-llm', title: 'Supply Chain Agent (MCP + LLM)', repo: 'SCM-using-MCP-and-LLM', domain: 'Agentic',
    blurb: 'Supply-chain decision agent exposing tools over the Model Context Protocol to an LLM planner.',
    tech: ['Python', 'MCP', 'LLMs'] },

  { slug: 'cag-vs-rag-showdown', title: 'CAG vs RAG Showdown', repo: 'CAG-vs-RAG-Showdown', domain: 'LLMs & GenAI',
    blurb: 'Benchmarks Context-Augmented vs Retrieval-Augmented Generation on latency, token cost, and LLM-as-judge quality.',
    tech: ['Python', 'FAISS', 'LLM-as-judge'], metrics: ['Latency + cost + quality benchmark'] },
  { slug: 'multimodal-rag', title: 'Multimodal RAG', repo: 'Multimodal-RAG', domain: 'LLMs & GenAI',
    blurb: 'RAG over text and images with embedding-based retrieval and grounded generation.',
    tech: ['Python', 'ChromaDB', 'CLIP', 'LLMs'] },
  { slug: 'llm-hallucination-detection', title: 'LLM Hallucination Detection', repo: 'LLM-Halucination-Detection', domain: 'LLMs & GenAI',
    blurb: 'Sentence-level grounding check using DeBERTa-v3 NLI to label claims GROUNDED / UNGROUNDED / CONTRADICTED.',
    tech: ['Python', 'DeBERTa-v3', 'Transformers'] },
  { slug: 'fine-tuned-domain-llm-qlora', title: 'Fine-Tuned Domain LLM (QLoRA)', repo: 'Fine-Tuned-Domain-LLM-QLoRA', domain: 'LLMs & GenAI',
    blurb: 'Parameter-efficient fine-tuning of an open LLM on a domain corpus using QLoRA.',
    tech: ['Python', 'PEFT', 'QLoRA', 'Transformers'] },

  { slug: 'super-resolution-han', title: 'Super-Resolution with HAN', repo: 'Super_Resolution_using_HAN', domain: 'Deep Learning',
    blurb: 'Single-image super-resolution using a Holistic Attention Network with residual channel attention.',
    tech: ['PyTorch', 'CNN', 'Attention'], metrics: ['SSIM / PSNR evaluated'] },
  { slug: 'multi-horizon-stock-forecasting', title: 'Multi-Horizon Stock Forecasting', repo: 'Multi-Horizon-Stock-Forecasting-AI-Model', domain: 'Deep Learning',
    blurb: 'Temporal Fusion Transformer with quantile (P10/P50/P90) outputs over 36+ engineered indicators.',
    tech: ['PyTorch', 'TFT', 'Time Series'] },
  { slug: 'all-about-neural-networks', title: 'Neural Nets From Scratch', repo: 'All-about-Neural-Networks', domain: 'Deep Learning',
    blurb: 'A custom autograd engine and neural nets built from first principles — backprop by hand.',
    tech: ['Python', 'NumPy', 'Autograd'] },

  { slug: 'ml-system-design-model-serving', title: 'ML System Design: Model Serving', repo: 'ML-System-Design-Model-Serving', domain: 'ML System Design',
    blurb: 'Reference design for low-latency model serving: batching, caching, and rollout strategy.',
    tech: ['Python', 'FastAPI', 'System Design'] },

  { slug: 'computer-vision-mlops-pipeline', title: 'Computer Vision MLOps Pipeline', repo: 'Computer-Vision-MLOps-Pipeline', domain: 'MLOps',
    blurb: 'End-to-end CV pipeline with experiment tracking, model registry, and automated retraining.',
    tech: ['Python', 'MLflow', 'Docker', 'GitHub Actions'] },
  { slug: 'ml-model-efficiency-toolkit', title: 'ML Model Efficiency Toolkit', repo: 'ML-Model-Efficiency-Toolkit', domain: 'MLOps',
    blurb: 'Tooling for quantization, pruning, and inference-cost profiling of trained models.',
    tech: ['Python', 'PyTorch', 'Quantization'] },

  { slug: 'fraud-detection-system', title: 'Fraud Detection System', repo: 'Fraud-Detection-System', domain: 'Classical ML',
    blurb: 'Imbalanced-class fraud classifier with SMOTE, threshold calibration, and gradient-boosted trees.',
    tech: ['Python', 'XGBoost', 'SMOTE'], metrics: ['Class-imbalance handled'] },
  { slug: 'churn-intelligence-engine', title: 'Churn Intelligence Engine', repo: 'Churn-Intelligence-Engine', domain: 'Classical ML',
    blurb: 'Customer-churn prediction with engineered behavioral features and calibrated probabilities.',
    tech: ['Python', 'scikit-learn', 'CatBoost'] },
  { slug: 'sepsis-ml-model', title: 'Sepsis Early-Warning Model', repo: 'Sepsis-ML-Model', domain: 'Classical ML',
    blurb: 'Clinical early-warning model on high-dimensional patient data with careful leakage prevention.',
    tech: ['Python', 'scikit-learn', 'Healthcare ML'] },

  { slug: 'data-analytics-portfolio', title: 'Data Analytics Portfolio', repo: 'Data-Analytics-Portfolio', domain: 'Data Science',
    blurb: 'EDA, hypothesis testing, and interactive dashboards across several real datasets.',
    tech: ['Pandas', 'Plotly', 'Tableau'], metrics: ['18-chart Plotly dashboard'] },

  { slug: 'nlp-pipeline-at-scale', title: 'NLP Pipeline at Scale', repo: 'NLP-Pipeline-at-Scale', domain: 'Data Science',
    blurb: 'Scalable text-processing pipeline: cleaning, embeddings, and downstream classification.',
    tech: ['Python', 'spaCy', 'Transformers'] },
]

export const projects: Project[] = raw.map((p) => ({ ...p, url: gh(p.repo) }))
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- projects`
Expected: PASS (3 tests). If "every domain has a project" fails, it's because `Visualization` and `CS/DSA` have no entry — that is expected for Phase 1. **Fix:** remove `'Visualization'` and `'CS/DSA'` from `DOMAINS` (Phase 1 has no projects there) so filters only show populated domains.

- [ ] **Step 6: Commit**

```bash
git add src/data
git commit -m "feat: typed project data model and curated repo metadata"
```

---

### Task 3: RAG chunker (pure function, TDD)

**Files:**
- Create: `src/rag/chunk.ts`
- Test: `src/rag/chunk.test.ts`

**Interfaces:**
- Produces: `function chunkText(text: string, opts?: { maxChars?: number; overlap?: number }): string[]` — splits on blank lines into paragraphs, then packs paragraphs into chunks up to `maxChars` (default 1200) with `overlap` characters (default 150) carried between chunks. Drops empty/whitespace-only chunks.

- [ ] **Step 1: Write the failing test**

`src/rag/chunk.test.ts`:
```ts
import { chunkText } from './chunk'

test('returns one chunk for short text', () => {
  expect(chunkText('hello world')).toEqual(['hello world'])
})

test('splits long text into multiple bounded chunks', () => {
  const para = 'x'.repeat(800)
  const text = [para, para, para].join('\n\n')
  const chunks = chunkText(text, { maxChars: 1000, overlap: 0 })
  expect(chunks.length).toBeGreaterThan(1)
  for (const c of chunks) expect(c.length).toBeLessThanOrEqual(1000)
})

test('drops empty chunks and trims', () => {
  const chunks = chunkText('\n\n   \n\nreal content\n\n   ')
  expect(chunks).toEqual(['real content'])
})

test('applies overlap between consecutive chunks', () => {
  const a = 'A'.repeat(600)
  const b = 'B'.repeat(600)
  const chunks = chunkText([a, b].join('\n\n'), { maxChars: 700, overlap: 100 })
  expect(chunks.length).toBe(2)
  expect(chunks[1].startsWith('A'.repeat(50))).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- chunk`
Expected: FAIL (cannot find `./chunk`).

- [ ] **Step 3: Implement `src/rag/chunk.ts`**

```ts
export function chunkText(
  text: string,
  opts: { maxChars?: number; overlap?: number } = {},
): string[] {
  const maxChars = opts.maxChars ?? 1200
  const overlap = opts.overlap ?? 150
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0)

  const chunks: string[] = []
  let current = ''
  for (const para of paragraphs) {
    if (current && current.length + para.length + 1 > maxChars) {
      chunks.push(current.trim())
      const tail = overlap > 0 ? current.slice(-overlap) : ''
      current = tail ? tail + ' ' + para : para
    } else {
      current = current ? current + ' ' + para : para
    }
    // Hard-split a single oversized paragraph.
    while (current.length > maxChars) {
      chunks.push(current.slice(0, maxChars).trim())
      current = (overlap > 0 ? current.slice(maxChars - overlap, maxChars) : '') + current.slice(maxChars)
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.filter((c) => c.length > 0)
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- chunk`
Expected: PASS (4 tests). If the overlap test fails, verify `current.slice(-overlap)` is prepended before the next paragraph.

- [ ] **Step 5: Commit**

```bash
git add src/rag/chunk.ts src/rag/chunk.test.ts
git commit -m "feat: paragraph-aware text chunker with overlap"
```

---

### Task 4: Build-time RAG indexer

**Files:**
- Create: `scripts/build-index.ts`, `src/rag/indexTypes.ts`
- Test: `scripts/build-index.test.ts`

**Interfaces:**
- Consumes: `chunkText` (Task 3), `projects` (Task 2).
- Produces:
  - `src/rag/indexTypes.ts`: `interface IndexChunk { id: string; repo: string; domain: string; title: string; url: string; text: string; embedding: number[] }` and `interface SearchIndex { model: string; dim: number; chunks: IndexChunk[] }`.
  - `scripts/build-index.ts`: reads each curated project's `README.md` from the repo source root + root `About_Me.md`, chunks, embeds with `Xenova/all-MiniLM-L6-v2` (mean-pooled, normalized), writes `public/search-index.json`. (WHAT AND WHY is deferred — see the "Later" note at the end of this task.)
  - Exported helper `buildIndex(opts: { repoRoot: string; embed: (texts: string[]) => Promise<number[][]> }): Promise<SearchIndex>` so the test can inject a fake embedder.

- [ ] **Step 1: Create `src/rag/indexTypes.ts`**

```ts
export interface IndexChunk {
  id: string
  repo: string
  domain: string
  title: string
  url: string
  text: string
  embedding: number[]
}

export interface SearchIndex {
  model: string
  dim: number
  chunks: IndexChunk[]
}

export const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2'
export const EMBED_DIM = 384
```

- [ ] **Step 2: Write the failing test**

`scripts/build-index.test.ts`:
```ts
import { buildIndex } from './build-index'

test('buildIndex produces a valid index using an injected embedder', async () => {
  const fakeEmbed = async (texts: string[]) =>
    texts.map(() => Array.from({ length: 384 }, () => 0.1))

  const index = await buildIndex({ repoRoot: process.cwd(), embed: fakeEmbed })

  expect(index.model).toBe('Xenova/all-MiniLM-L6-v2')
  expect(index.dim).toBe(384)
  expect(index.chunks.length).toBeGreaterThan(0)
  for (const c of index.chunks) {
    expect(c.embedding.length).toBe(384)
    expect(c.text.length).toBeGreaterThan(0)
    expect(c.url).toMatch(/^https:\/\/github\.com\/shiva-shivanibokka\//)
  }
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- build-index`
Expected: FAIL (cannot find `./build-index`).

- [ ] **Step 4: Implement `scripts/build-index.ts`**

```ts
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chunkText } from '../src/rag/chunk'
import { projects } from '../src/data/projects'
import { EMBED_DIM, EMBED_MODEL, type IndexChunk, type SearchIndex } from '../src/rag/indexTypes'

async function readIfExists(p: string): Promise<string> {
  try {
    return await fs.readFile(p, 'utf8')
  } catch {
    return ''
  }
}

export async function buildIndex(opts: {
  repoRoot: string
  embed: (texts: string[]) => Promise<number[][]>
}): Promise<SearchIndex> {
  const { repoRoot, embed } = opts
  const chunks: Omit<IndexChunk, 'embedding'>[] = []

  // Per-project corpus: README + the project blurb.
  // (WHAT AND WHY write-ups are deferred to a later phase — see note below.)
  for (const p of projects) {
    const readme = await readIfExists(path.join(repoRoot, p.repo, 'README.md'))
    const corpus = [`# ${p.title}\n${p.blurb}`, readme].filter(Boolean).join('\n\n')
    chunkText(corpus).forEach((text, i) => {
      chunks.push({ id: `${p.slug}-${i}`, repo: p.repo, domain: p.domain, title: p.title, url: p.url, text })
    })
  }

  // About chunks (no repo) so "who are you / experience" queries match.
  const about = await readIfExists(path.join(repoRoot, 'About_Me.md'))
  chunkText(about).forEach((text, i) => {
    chunks.push({
      id: `about-${i}`, repo: '', domain: 'Data Science', title: 'About Shivani',
      url: 'https://github.com/shiva-shivanibokka', text,
    })
  })

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
  const repoRoot = path.resolve(projectRoot, '..') // the GITHUB REPOS parent
  const index = await buildIndex({ repoRoot, embed: realEmbed })
  const outDir = path.join(projectRoot, 'public')
  await fs.mkdir(outDir, { recursive: true })
  await fs.writeFile(path.join(outDir, 'search-index.json'), JSON.stringify(index))
  console.log(`Wrote ${index.chunks.length} chunks to public/search-index.json`)
}

// Run main() only when executed directly, not when imported by the test.
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (invokedDirectly) main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 5: Run the test**

Run: `npm test -- build-index`
Expected: PASS. (The test injects `fakeEmbed`; it does not download the model.)

- [ ] **Step 6: Generate the real index**

Run: `npm run build:index`
Expected: downloads the model once, prints `Wrote N chunks to public/search-index.json`, and `public/search-index.json` exists with non-empty `chunks`.

- [ ] **Step 7: Commit**

```bash
git add scripts/build-index.ts scripts/build-index.test.ts src/rag/indexTypes.ts public/search-index.json
git commit -m "feat: build-time RAG indexer over repo READMEs and About_Me"
```

**Maintenance (no code changes needed when READMEs change):** Whenever a repo's
`README.md` is revamped/expanded, just re-run `npm run build:index` and commit the
updated `public/search-index.json`. The indexer reads whatever the READMEs contain —
richer READMEs simply produce richer retrieval. The only time `src/data/projects.ts`
needs editing is when a repo is renamed, added, or removed from the curated set.

**Later (deferred — WHAT AND WHY):** Once `WHAT AND WHY/<repo>/` write-ups exist for
all curated projects, add them as a second corpus source in the per-project loop:
read `WHAT AND WHY/<repo>/*.md` with `readIfExists`, append to `corpus`, then
re-run `npm run build:index`. No other code changes required.

---

### Task 5: Runtime retriever (TDD)

**Files:**
- Create: `src/rag/retriever.ts`
- Test: `src/rag/retriever.test.ts`

**Interfaces:**
- Consumes: `SearchIndex`, `IndexChunk` (Task 4).
- Produces:
  - `function cosineSim(a: number[], b: number[]): number`
  - `function topK(index: SearchIndex, queryEmbedding: number[], k?: number): Array<IndexChunk & { score: number }>` (default k=4, descending score)
  - `class Retriever` with `static async create(indexUrl?: string): Promise<Retriever>` (lazy-loads index + transformers.js model) and `async search(query: string, k?: number): Promise<Array<IndexChunk & { score: number }>>`. The model/index loading is isolated so `topK`/`cosineSim` stay pure and unit-testable without any download.

- [ ] **Step 1: Write the failing test**

`src/rag/retriever.test.ts`:
```ts
import { cosineSim, topK } from './retriever'
import type { SearchIndex } from './indexTypes'

test('cosineSim of identical vectors is 1', () => {
  expect(cosineSim([1, 0, 0], [1, 0, 0])).toBeCloseTo(1)
})

test('cosineSim of orthogonal vectors is 0', () => {
  expect(cosineSim([1, 0], [0, 1])).toBeCloseTo(0)
})

test('topK returns the closest chunks in descending score order', () => {
  const index: SearchIndex = {
    model: 'm', dim: 2,
    chunks: [
      { id: 'a', repo: 'A', domain: 'Agentic', title: 'A', url: 'u', text: 'a', embedding: [1, 0] },
      { id: 'b', repo: 'B', domain: 'Agentic', title: 'B', url: 'u', text: 'b', embedding: [0, 1] },
      { id: 'c', repo: 'C', domain: 'Agentic', title: 'C', url: 'u', text: 'c', embedding: [0.9, 0.1] },
    ],
  }
  const out = topK(index, [1, 0], 2)
  expect(out.map((c) => c.id)).toEqual(['a', 'c'])
  expect(out[0].score).toBeGreaterThanOrEqual(out[1].score)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- retriever`
Expected: FAIL (cannot find `./retriever`).

- [ ] **Step 3: Implement `src/rag/retriever.ts`**

```ts
import { EMBED_MODEL, type IndexChunk, type SearchIndex } from './indexTypes'

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export type ScoredChunk = IndexChunk & { score: number }

export function topK(index: SearchIndex, queryEmbedding: number[], k = 4): ScoredChunk[] {
  return index.chunks
    .map((c) => ({ ...c, score: cosineSim(c.embedding, queryEmbedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
}

export class Retriever {
  private constructor(
    private index: SearchIndex,
    private embed: (q: string) => Promise<number[]>,
  ) {}

  static async create(indexUrl = `${import.meta.env.BASE_URL}search-index.json`): Promise<Retriever> {
    const index: SearchIndex = await fetch(indexUrl).then((r) => r.json())
    const { pipeline } = await import('@xenova/transformers')
    const extractor = await pipeline('feature-extraction', EMBED_MODEL)
    const embed = async (q: string) => {
      const res = await extractor(q, { pooling: 'mean', normalize: true })
      return Array.from(res.data as Float32Array)
    }
    return new Retriever(index, embed)
  }

  async search(query: string, k = 4): Promise<ScoredChunk[]> {
    const q = await this.embed(query)
    return topK(this.index, q, k)
  }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- retriever`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/rag/retriever.ts src/rag/retriever.test.ts
git commit -m "feat: cosine top-k retriever with lazy transformers.js query embedding"
```

---

### Task 6: Answer assembly (TDD)

**Files:**
- Create: `src/rag/answer.ts`
- Test: `src/rag/answer.test.ts`

**Interfaces:**
- Consumes: `ScoredChunk` (Task 5).
- Produces: `interface Answer { body: string; sources: Array<{ title: string; url: string; repo: string }>; empty: boolean }` and `function buildAnswer(results: ScoredChunk[], opts?: { minScore?: number }): Answer` — keeps results above `minScore` (default 0.25), joins their text into a readable body, and lists unique sources (by url). If nothing clears the threshold, returns `{ empty: true }`.

- [ ] **Step 1: Write the failing test**

`src/rag/answer.test.ts`:
```ts
import { buildAnswer } from './answer'
import type { ScoredChunk } from './retriever'

const mk = (over: Partial<ScoredChunk>): ScoredChunk => ({
  id: 'x', repo: 'R', domain: 'Agentic', title: 'T', url: 'https://u', text: 'text', score: 0.9, ...over,
})

test('returns empty answer when nothing clears threshold', () => {
  const ans = buildAnswer([mk({ score: 0.1 })], { minScore: 0.25 })
  expect(ans.empty).toBe(true)
})

test('assembles body and dedupes sources by url', () => {
  const ans = buildAnswer([
    mk({ id: '1', text: 'first', url: 'https://a', title: 'A' }),
    mk({ id: '2', text: 'second', url: 'https://a', title: 'A' }),
    mk({ id: '3', text: 'third', url: 'https://b', title: 'B' }),
  ])
  expect(ans.empty).toBe(false)
  expect(ans.body).toContain('first')
  expect(ans.body).toContain('third')
  expect(ans.sources).toHaveLength(2)
  expect(ans.sources.map((s) => s.url)).toEqual(['https://a', 'https://b'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- answer`
Expected: FAIL (cannot find `./answer`).

- [ ] **Step 3: Implement `src/rag/answer.ts`**

```ts
import type { ScoredChunk } from './retriever'

export interface Answer {
  body: string
  sources: Array<{ title: string; url: string; repo: string }>
  empty: boolean
}

export function buildAnswer(results: ScoredChunk[], opts: { minScore?: number } = {}): Answer {
  const minScore = opts.minScore ?? 0.25
  const kept = results.filter((r) => r.score >= minScore)
  if (kept.length === 0) return { body: '', sources: [], empty: true }

  const body = kept.map((r) => r.text).join('\n\n')

  const seen = new Set<string>()
  const sources: Answer['sources'] = []
  for (const r of kept) {
    if (r.url && !seen.has(r.url)) {
      seen.add(r.url)
      sources.push({ title: r.title, url: r.url, repo: r.repo })
    }
  }
  return { body, sources, empty: false }
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- answer`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/rag/answer.ts src/rag/answer.test.ts
git commit -m "feat: extractive answer assembly with threshold and source dedupe"
```

---

### Task 7: AskBox component (hero RAG UI)

**Files:**
- Create: `src/components/AskBox.tsx`, `src/hooks/useRetriever.ts`
- Test: `src/components/AskBox.test.tsx`

**Interfaces:**
- Consumes: `Retriever` (Task 5), `buildAnswer`/`Answer` (Task 6).
- Produces: `useRetriever()` hook returning `{ ask, status }` where `status` is `'idle' | 'loading' | 'ready' | 'error'` and `ask(query: string): Promise<Answer>`; `<AskBox />` accepting an optional `ask` prop (for testing) defaulting to the hook, rendering input, suggested chips, loading pulse, answer + sources, and empty/error states.

- [ ] **Step 1: Write the failing test**

`src/components/AskBox.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AskBox from './AskBox'
import type { Answer } from '../rag/answer'

test('shows answer and sources after asking', async () => {
  const fakeAsk = async (_q: string): Promise<Answer> => ({
    body: 'I built CAG vs RAG Showdown.',
    sources: [{ title: 'CAG vs RAG Showdown', url: 'https://github.com/shiva-shivanibokka/CAG-vs-RAG-Showdown', repo: 'CAG-vs-RAG-Showdown' }],
    empty: false,
  })
  render(<AskBox ask={fakeAsk} />)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'best rag project' } })
  fireEvent.submit(screen.getByRole('search'))
  await waitFor(() => expect(screen.getByText(/CAG vs RAG Showdown/)).toBeInTheDocument())
  expect(screen.getByRole('link', { name: /CAG vs RAG Showdown/i })).toHaveAttribute('href', expect.stringContaining('CAG-vs-RAG-Showdown'))
})

test('shows empty state when no match', async () => {
  const fakeAsk = async (): Promise<Answer> => ({ body: '', sources: [], empty: true })
  render(<AskBox ask={fakeAsk} />)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyz' } })
  fireEvent.submit(screen.getByRole('search'))
  await waitFor(() => expect(screen.getByText(/didn't find a strong match/i)).toBeInTheDocument())
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- AskBox`
Expected: FAIL (cannot find `./AskBox`).

- [ ] **Step 3: Implement `src/hooks/useRetriever.ts`**

```ts
import { useCallback, useRef, useState } from 'react'
import { Retriever } from '../rag/retriever'
import { buildAnswer, type Answer } from '../rag/answer'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function useRetriever() {
  const [status, setStatus] = useState<Status>('idle')
  const retrieverRef = useRef<Retriever | null>(null)

  const ask = useCallback(async (query: string): Promise<Answer> => {
    try {
      if (!retrieverRef.current) {
        setStatus('loading')
        retrieverRef.current = await Retriever.create()
      }
      setStatus('loading')
      const results = await retrieverRef.current.search(query, 4)
      setStatus('ready')
      return buildAnswer(results)
    } catch (e) {
      setStatus('error')
      throw e
    }
  }, [])

  return { ask, status }
}
```

- [ ] **Step 4: Implement `src/components/AskBox.tsx`**

```tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRetriever } from '../hooks/useRetriever'
import type { Answer } from '../rag/answer'

const CHIPS = ['agentic systems', 'RAG vs CAG', 'deep learning from scratch', 'MLOps', 'healthcare ML']

type State = 'idle' | 'thinking' | 'done' | 'error'

export default function AskBox({ ask: askProp }: { ask?: (q: string) => Promise<Answer> }) {
  const hook = useRetriever()
  const ask = askProp ?? hook.ask
  const [query, setQuery] = useState('')
  const [state, setState] = useState<State>('idle')
  const [answer, setAnswer] = useState<Answer | null>(null)

  async function run(q: string) {
    if (!q.trim()) return
    setState('thinking')
    setAnswer(null)
    try {
      const a = await ask(q)
      setAnswer(a)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); run(query) }}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-surface p-2 shadow-xl"
      >
        <input
          type="search"
          aria-label="Ask anything about my work"
          placeholder="Ask anything about my work…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent px-3 py-3 text-text placeholder:text-muted focus:outline-none"
        />
        <button type="submit" className="rounded-xl bg-primary px-4 py-3 font-medium text-base hover:opacity-90">
          Ask
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => { setQuery(c); run(c) }}
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-muted hover:border-warm hover:text-warm"
          >
            {c}
          </button>
        ))}
      </div>

      {state === 'thinking' && (
        <motion.p
          className="mt-4 flex items-center gap-2 text-warm"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          <span className="h-2 w-2 rounded-full bg-warm" /> thinking — retrieving from my repos…
        </motion.p>
      )}

      {state === 'done' && answer && (
        answer.empty ? (
          <p className="mt-4 text-muted">
            I didn't find a strong match — try a broader term, or browse{' '}
            <a href="#projects" className="text-primary underline">projects</a>.
          </p>
        ) : (
          <div className="mt-4 rounded-xl border border-white/10 bg-surface p-4">
            <p className="whitespace-pre-line text-text">{answer.body}</p>
            {answer.sources.length > 0 && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">Sources</p>
                <ul className="flex flex-wrap gap-2">
                  {answer.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:text-warm underline">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      )}

      {state === 'error' && (
        <p className="mt-4 text-muted">
          Something went wrong loading the model. Browse{' '}
          <a href="#projects" className="text-primary underline">projects</a> instead.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- AskBox`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/AskBox.tsx src/hooks/useRetriever.ts src/components/AskBox.test.tsx
git commit -m "feat: AskBox hero RAG UI with chips, thinking pulse, sources, and states"
```

---

### Task 8: Hero section with reduced-motion-aware neural motif

**Files:**
- Create: `src/components/Hero.tsx`, `src/components/NeuralBackdrop.tsx`, `src/hooks/usePrefersReducedMotion.ts`
- Test: `src/hooks/usePrefersReducedMotion.test.ts`

**Interfaces:**
- Consumes: `AskBox` (Task 7).
- Produces: `usePrefersReducedMotion(): boolean`; `<NeuralBackdrop />` (decorative, `aria-hidden`, renders nothing animated when reduced motion is preferred); `<Hero />` composing name, identity line, `NeuralBackdrop`, and `AskBox`.

- [ ] **Step 1: Write the failing test**

`src/hooks/usePrefersReducedMotion.test.ts`:
```ts
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

test('returns true when the OS prefers reduced motion', () => {
  window.matchMedia = ((q: string) => ({
    matches: true, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as any
  const { result } = renderHook(() => usePrefersReducedMotion())
  expect(result.current).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- usePrefersReducedMotion`
Expected: FAIL (cannot find module).

- [ ] **Step 3: Implement `src/hooks/usePrefersReducedMotion.ts`**

```ts
import { useEffect, useState } from 'react'

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}
```

- [ ] **Step 4: Implement `src/components/NeuralBackdrop.tsx`**

```tsx
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Decorative animated SVG node-graph behind the hero. CSS-only animation so it
// stays cheap; disabled entirely when the user prefers reduced motion.
export default function NeuralBackdrop() {
  const reduced = usePrefersReducedMotion()
  const nodes = [
    [12, 20], [28, 60], [48, 30], [68, 70], [82, 40], [60, 18], [36, 84],
  ]
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => (
          <line key={`${i}-${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#7C6CF0" strokeWidth={0.15} strokeOpacity={0.4} />
        )),
      )}
      {nodes.map((n, i) => (
        <circle key={i} cx={n[0]} cy={n[1]} r={0.9} fill={i % 3 === 0 ? '#FF8A6B' : '#7C6CF0'}>
          {!reduced && (
            <animate attributeName="r" values="0.9;1.6;0.9" dur={`${3 + (i % 3)}s`} repeatCount="indefinite" />
          )}
        </circle>
      ))}
    </svg>
  )
}
```

- [ ] **Step 5: Implement `src/components/Hero.tsx`**

```tsx
import AskBox from './AskBox'
import NeuralBackdrop from './NeuralBackdrop'

export default function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <NeuralBackdrop />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Shivani Bokka</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          AI/ML Engineer — I build agents, RAG systems, and deep-learning models.
          <span className="text-text"> This page runs a real RAG over my own work.</span>
        </p>
        <div className="mt-8 flex w-full justify-center">
          <AskBox />
        </div>
        <a href="#projects" className="mt-10 text-sm text-muted hover:text-warm">↓ explore projects</a>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Run the tests**

Run: `npm test -- usePrefersReducedMotion`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Hero.tsx src/components/NeuralBackdrop.tsx src/hooks/usePrefersReducedMotion.ts src/hooks/usePrefersReducedMotion.test.ts
git commit -m "feat: hero with reduced-motion-aware neural backdrop"
```

---

### Task 9: Projects grid with domain filtering

**Files:**
- Create: `src/components/ProjectCard.tsx`, `src/components/ProjectGrid.tsx`
- Test: `src/components/ProjectGrid.test.tsx`

**Interfaces:**
- Consumes: `projects`, `DOMAINS`, `Project` (Task 2).
- Produces: `<ProjectCard project={p} />`; `<ProjectGrid />` with an "All" + per-domain filter bar that narrows the visible cards.

- [ ] **Step 1: Write the failing test**

`src/components/ProjectGrid.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ProjectGrid from './ProjectGrid'
import { projects } from '../data/projects'

test('renders all projects by default and filters by domain', () => {
  render(<ProjectGrid />)
  expect(screen.getAllByRole('article')).toHaveLength(projects.length)
  fireEvent.click(screen.getByRole('button', { name: 'Agentic' }))
  const agentic = projects.filter((p) => p.domain === 'Agentic').length
  expect(screen.getAllByRole('article')).toHaveLength(agentic)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ProjectGrid`
Expected: FAIL (cannot find `./ProjectGrid`).

- [ ] **Step 3: Implement `src/components/ProjectCard.tsx`**

```tsx
import type { Project } from '../data/types'

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex flex-col rounded-xl border border-white/10 bg-surface p-5 transition hover:border-primary/60">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{project.domain}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-text">{project.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{project.blurb}</p>
      {project.metrics && project.metrics.length > 0 && (
        <p className="mt-3 text-xs font-mono text-warm">{project.metrics.join(' · ')}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tech.map((t) => (
          <span key={t} className="rounded border border-white/10 px-2 py-0.5 text-xs text-muted">{t}</span>
        ))}
      </div>
      <a href={project.url} target="_blank" rel="noreferrer" className="mt-4 text-sm text-primary hover:text-warm">
        View repo →
      </a>
    </article>
  )
}
```

- [ ] **Step 4: Implement `src/components/ProjectGrid.tsx`**

```tsx
import { useState } from 'react'
import { projects, DOMAINS } from '../data/projects'
import type { Domain } from '../data/types'
import ProjectCard from './ProjectCard'

type Filter = Domain | 'All'

export default function ProjectGrid() {
  const [filter, setFilter] = useState<Filter>('All')
  const visible = filter === 'All' ? projects : projects.filter((p) => p.domain === filter)
  const filters: Filter[] = ['All', ...DOMAINS]

  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-bold">Projects</h2>
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              filter === f ? 'bg-primary text-base' : 'border border-white/10 text-muted hover:text-warm'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- ProjectGrid`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ProjectCard.tsx src/components/ProjectGrid.tsx src/components/ProjectGrid.test.tsx
git commit -m "feat: filterable projects grid with cards"
```

---

### Task 10: Static content sections (Domains, Experience, Skills, About)

**Files:**
- Create: `src/data/content.ts`, `src/components/DomainsBand.tsx`, `src/components/Experience.tsx`, `src/components/Skills.tsx`, `src/components/About.tsx`
- Test: `src/components/sections.test.tsx`

**Interfaces:**
- Consumes: `DOMAINS` (Task 2).
- Produces: `content.ts` exporting `experience: Array<{ role: string; org: string; period: string; bullets: string[] }>`, `skillGroups: Array<{ label: string; items: string[] }>`, `bio: string`, `links: { label: string; url: string }[]`; four presentational components consuming them.

- [ ] **Step 1: Write the failing test**

`src/components/sections.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import DomainsBand from './DomainsBand'
import Experience from './Experience'
import Skills from './Skills'
import About from './About'

test('domains band lists every domain', () => {
  render(<DomainsBand />)
  expect(screen.getByText('Agentic')).toBeInTheDocument()
  expect(screen.getByText('MLOps')).toBeInTheDocument()
})

test('experience renders roles with periods', () => {
  render(<Experience />)
  expect(screen.getByText(/Teaching Assistant/i)).toBeInTheDocument()
})

test('skills renders grouped skills', () => {
  render(<Skills />)
  expect(screen.getByText(/Languages/i)).toBeInTheDocument()
})

test('about renders bio and an email link', () => {
  render(<About />)
  expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute('href', expect.stringContaining('mailto:'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- sections`
Expected: FAIL (cannot find modules).

- [ ] **Step 3: Implement `src/data/content.ts`**

> Source content from `About_Me.md`. Keep bullets concise.

```ts
export const experience = [
  { role: 'Teaching Assistant — Data Science & ML (PINC)', org: 'SFSU', period: 'Aug 2025 – Present',
    bullets: ['Support 20+ students in Python, data analysis, and ML', 'Run weekly sessions and office hours', 'Guide real projects in PyTorch, TensorFlow, scikit-learn'] },
  { role: 'Vice President Finance', org: 'Associated Students, SFSU', period: 'Jun 2025 – Present',
    bullets: ['Manage a $100,000+ budget across organizations', 'Chair the weekly Finance Committee', 'Secured $50,000 for the Gator Groceries initiative'] },
  { role: 'TA / Grader — Pattern Analysis & Machine Intelligence', org: 'SFSU', period: 'Feb 2025 – May 2025',
    bullets: ['Led weekly algorithm sessions in MATLAB and Python', 'Supported 40+ students', 'Graded 200+ assignments with rubric feedback'] },
  { role: 'Manager, Marketing & New Technologies', org: 'Stagecraft Pvt Ltd, New Delhi', period: 'Aug 2022 – Mar 2024',
    bullets: ['Led 15+ multimedia projects', 'Raised engagement 10% and retention 15%', 'Improved workflows 15% via technology integration'] },
]

export const skillGroups = [
  { label: 'Languages', items: ['Python', 'SQL', 'JavaScript', 'TypeScript'] },
  { label: 'ML', items: ['scikit-learn', 'XGBoost', 'CatBoost', 'SMOTE', 'Bayesian Optimization'] },
  { label: 'Deep Learning', items: ['PyTorch', 'TensorFlow', 'Transformers', 'LSTM', 'Attention', 'TFT'] },
  { label: 'LLMs & GenAI', items: ['RAG', 'CAG', 'LangGraph', 'MCP', 'FAISS', 'ChromaDB', 'Prompt Engineering'] },
  { label: 'MLOps', items: ['MLflow', 'Docker', 'AWS', 'GitHub Actions', 'FastAPI'] },
  { label: 'Data & Viz', items: ['Pandas', 'NumPy', 'Plotly', 'Tableau', 'Power BI'] },
]

export const bio =
  "Graduate student in Data Science & AI at SFSU (GPA 3.93). I build across the full AI lifecycle — classical ML on clinical genomics, agentic systems with multi-provider LLM orchestration, RAG/CAG architectures, and MLOps tooling. Currently seeking AI/ML engineering, data science, and software engineering roles."

export const links = [
  { label: 'Email', url: 'mailto:shivani.bokka93@gmail.com' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/shivani-bokka' },
  { label: 'GitHub', url: 'https://github.com/shiva-shivanibokka' },
  { label: 'Resume', url: '/resume.pdf' },
]
```

- [ ] **Step 4: Implement the four components**

`src/components/DomainsBand.tsx`:
```tsx
import { DOMAINS } from '../data/projects'

export default function DomainsBand() {
  return (
    <section className="border-y border-white/10 bg-surface/40 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-sm uppercase tracking-widest text-muted">What I cover</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {DOMAINS.map((d) => (
            <span key={d} className="rounded-full border border-primary/30 px-4 py-1.5 text-sm text-text">{d}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
```

`src/components/Experience.tsx`:
```tsx
import { experience } from '../data/content'

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="text-3xl font-bold">Experience</h2>
      <div className="mt-8 space-y-8 border-l border-white/10 pl-6">
        {experience.map((e) => (
          <div key={`${e.role}-${e.period}`} className="relative">
            <span className="absolute -left-[1.7rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <p className="text-sm text-warm">{e.period}</p>
            <h3 className="mt-1 font-semibold text-text">{e.role}</h3>
            <p className="text-sm text-muted">{e.org}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {e.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
```

`src/components/Skills.tsx`:
```tsx
import { skillGroups } from '../data/content'

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-bold">Skills</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((g) => (
          <div key={g.label} className="rounded-xl border border-white/10 bg-surface p-5">
            <h3 className="font-semibold text-primary">{g.label}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {g.items.map((s) => (
                <span key={s} className="rounded border border-white/10 px-2 py-0.5 text-xs text-muted">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
```

`src/components/About.tsx`:
```tsx
import { bio, links } from '../data/content'

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h2 className="text-3xl font-bold">About & Contact</h2>
      <p className="mt-6 text-muted">{bio}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target={l.url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="rounded-xl border border-primary/40 px-5 py-2 text-text hover:border-warm hover:text-warm"
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- sections`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/data/content.ts src/components/DomainsBand.tsx src/components/Experience.tsx src/components/Skills.tsx src/components/About.tsx src/components/sections.test.tsx
git commit -m "feat: domains, experience, skills, and about sections"
```

---

### Task 11: Assemble the page (App) + nav

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/Nav.tsx`
- Test: `src/App.test.tsx` (update)

**Interfaces:**
- Consumes: all section components.
- Produces: full single-page layout with a sticky top nav linking to sections.

- [ ] **Step 1: Update the failing test**

Replace `src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the hero name and all major sections', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /Shivani Bokka/i, level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /^Projects$/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /^Experience$/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /^Skills$/ })).toBeInTheDocument()
  expect(screen.getByRole('navigation')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- App`
Expected: FAIL (only hero exists; no Projects/nav).

- [ ] **Step 3: Implement `src/components/Nav.tsx`**

```tsx
const ITEMS = [
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'About', href: '#about' },
]

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-base/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <a href="#" className="font-semibold tracking-tight">shivani<span className="text-primary">.ai</span></a>
        <div className="flex gap-5 text-sm text-muted">
          {ITEMS.map((i) => (
            <a key={i.href} href={i.href} className="hover:text-warm">{i.label}</a>
          ))}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Update `src/App.tsx`**

```tsx
import Nav from './components/Nav'
import Hero from './components/Hero'
import DomainsBand from './components/DomainsBand'
import ProjectGrid from './components/ProjectGrid'
import Experience from './components/Experience'
import Skills from './components/Skills'
import About from './components/About'

export default function App() {
  return (
    <div className="min-h-screen bg-base text-text">
      <Nav />
      <main>
        <Hero />
        <DomainsBand />
        <ProjectGrid />
        <Experience />
        <Skills />
        <About />
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        Built by Shivani Bokka — this page runs a real in-browser RAG over my repos.
      </footer>
    </div>
  )
}
```

- [ ] **Step 5: Run the tests + full build**

Run: `npm test`
Expected: ALL tests PASS.
Run: `npm run build:index && npx tsc -b && npx vite build`
Expected: clean build, `dist/` produced.

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`, open the local URL, ask the box "what's your best RAG project?" and confirm a cited answer renders (model downloads once). Tab through the page to verify keyboard focus and that reduced-motion disables the backdrop pulse.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/Nav.tsx src/App.test.tsx
git commit -m "feat: assemble full single-page layout with sticky nav"
```

---

### Task 12: GitHub Pages deployment

**Files:**
- Create: `.github/workflows/deploy.yml`, `public/.nojekyll`, `public/resume.pdf` (placeholder note below)

**Interfaces:**
- Produces: CI that builds the RAG index + site and publishes to GitHub Pages on push to `main`.

- [ ] **Step 1: Add `public/.nojekyll`** (empty file — prevents Jekyll from touching `_`-prefixed assets).

```bash
touch public/.nojekyll
```

- [ ] **Step 2: Add résumé**

Copy Shivani's résumé PDF to `public/resume.pdf` (so the About "Resume" link resolves). If not yet available, create a one-line placeholder text file at `public/resume.pdf` and replace later — note this is a temporary stand-in, not final.

- [ ] **Step 3: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

> Note: `npm run build` runs `build:index`, which reads sibling repos at `../<repo>`. In CI those siblings are not checked out, so READMEs resolve to empty and only the `projects.ts` blurbs + `About_Me.md` (also absent in CI) are indexed — yielding a thin index. **Therefore the committed `public/search-index.json` (generated locally in Task 4) is the source of truth.** Change the CI build step to skip re-indexing: use `run: npx tsc -b && npx vite build` instead of `npm run build`, so the committed index ships as-is. Regenerate the index locally with `npm run build:index` whenever repo content changes, and commit it.

- [ ] **Step 4: Apply the CI fix from the note**

Edit `.github/workflows/deploy.yml` build step `- run: npm run build` → `- run: npx tsc -b && npx vite build`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy.yml public/.nojekyll public/resume.pdf
git commit -m "ci: GitHub Pages deploy shipping prebuilt RAG index"
```

- [ ] **Step 6: Enable Pages (manual, by Shivani)**

On github.com → repo Settings → Pages → Source: "GitHub Actions". Push `main` to `shiva-shivanibokka/shiva-shivanibokka.github.io`. Confirm the site loads at https://shiva-shivanibokka.github.io and the Ask box returns a cited answer.

---

## Self-Review

**Spec coverage:**
- Hero + Ask box → Tasks 7, 8 ✓
- Real in-browser extractive RAG (build index, retrieve, answer, cite) → Tasks 3–7 ✓
- Projects filterable by domain → Tasks 2, 9 ✓
- Domains band / breadth → Task 10 ✓
- Experience, Skills, About + resume + contact → Task 10 ✓
- Violet+Coral theme, warm-ivory text, reduced-motion → Tasks 1, 8 ✓
- Vite+React+TS+Tailwind+framer-motion+transformers.js → Tasks 1, 4, 5, 7 ✓
- GitHub Pages deploy at user-site → Task 12 ✓
- Curated ~15–20 repos → Task 2 (20 entries) ✓
- Error/empty states, a11y, responsive → Tasks 7, 9, 11 ✓
- Testing (unit retriever/chunker/indexer, component states) → Tasks 3–11 ✓

**Placeholder scan:** `public/resume.pdf` is the only deliberate stand-in (real PDF dropped in by Shivani); flagged explicitly in Task 12, not a hidden TODO. No other placeholders.

**Type consistency:** `Project`/`Domain` (Task 2) consistent across Tasks 9–11. `IndexChunk`/`SearchIndex`/`EMBED_MODEL`/`EMBED_DIM` (Task 4) reused by Tasks 5–6. `ScoredChunk` (Task 5) consumed by Tasks 6–7. `Answer` (Task 6) consumed by Task 7. Embedding call shape (`pooling: 'mean', normalize: true`) identical in indexer and retriever. ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-29-ai-portfolio.md`.
