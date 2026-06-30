# Design Spec — "Ask My Work": AI/ML Engineer Portfolio

**Author:** Shivani Bokka
**Date:** 2026-06-29
**Status:** Approved design → ready for implementation plan

---

## 1. Summary

A personal portfolio website for an aspiring AI/ML engineer whose **hero feature is a real Retrieval-Augmented Generation (RAG) system that runs entirely in the visitor's browser** and answers questions about Shivani's own body of work. The site is itself a working demonstration of the skills it advertises.

It is inspired by a family member's terminal-themed GitHub Pages portfolio but deliberately differentiated: instead of a static, templated CLI gimmick, this site *does* AI. The medium is the message.

**One-line pitch:** "An AI/ML portfolio that runs RAG on itself."

---

## 2. Goals & non-goals

### Goals
- Make Shivani memorable to recruiters and hiring managers in AI/ML/DS.
- Prove, not just claim, ability to build a real (if small) AI system — visible, inspectable, honest.
- Showcase the **breadth** of her masters work: AI, ML, DL, Agentic, NLP, MLOps, Data Science, Visualization.
- Be free to host, fast to load, and reliable on any device (including a recruiter's phone).
- Be defensible in interviews — every technology used appears on her résumé.

### Non-goals (Phase 1)
- No server, no backend, no API keys, no paid infrastructure.
- No generative (LLM-written) answers in Phase 1 — extractive retrieval only.
- No per-project deep-dive pages in Phase 1 (deferred).
- No CMS / blog.

---

## 3. Users

- **Primary:** technical recruiters and hiring managers screening AI/ML/DS candidates.
- **Secondary:** engineers / interviewers who may inspect the site's behavior and source (so it must be genuinely real, not faked).

---

## 4. Concept & content

### 4.1 Hero — the "Ask My Work" box
The first thing a visitor sees is Shivani's name, a one-line identity, and a prominent **ask/search box**: *"Ask anything about my work."* Clickable suggested-prompt chips seed it (e.g. "agentic systems", "RAG vs CAG", "MLOps", "deep learning from scratch", "what did you build for healthcare?").

On submit, the site runs a real RAG retrieval (Section 5) and renders a clean, formatted answer assembled from the most relevant chunks across her repos, **with citations/links to the actual repositories**. A warm coral "thinking…" pulse plays during retrieval.

A small **"How this works"** affordance explains it is genuine client-side RAG (transparency is a feature).

### 4.2 Site map

| Section | Contents |
|---|---|
| Hero + Ask box | Name, identity line, RAG chat, suggested-prompt chips. |
| Domains / "What I cover" | Visual band of breadth: AI · ML · DL · Agentic · NLP · MLOps · DS · Visualization. |
| Projects | Curated repo cards, **filterable by domain**; each card: title, one-liner, tech badges, key metric(s), repo link. |
| Experience | TA roles, VP Finance (AS, SFSU), industry (Stagecraft) — timeline format. |
| Skills | Existing skill taxonomy, grouped & scannable (not a wall of 40 badges). |
| About + Contact | Short bio, social links, **résumé download**. |

### 4.3 Domain buckets (for filtering & the RAG `domain` metadata)
Agentic Systems · LLMs & GenAI (RAG/CAG) · Deep Learning · Classical ML · ML System Design · MLOps · Data Science & Analytics · Visualization · CS/DSA.

### 4.4 Phase 1 curated repo set (~15–20, to be confirmed by Shivani)
Draft selection across domains (final list confirmed before indexing):

- **Agentic:** Autonomous-SWE-Agent, AutoApply-Job-Agent, Autonomous-Research-Report-Agent, Autonomous-ML-Pipeline-Builder, CodePilot-Agent, SCM-using-MCP-and-LLM
- **LLMs & GenAI:** CAG-vs-RAG-Showdown, Multimodal-RAG, LLM-Halucination-Detection, Fine-Tuned-Domain-LLM-QLoRA
- **Deep Learning:** Super_Resolution_using_HAN, Multi-Horizon-Stock-Forecasting-AI-Model, All-about-Neural-Networks (from-scratch autograd)
- **ML System Design:** ML-System-Design-Model-Serving (+ siblings as breadth)
- **MLOps:** Computer-Vision-MLOps-Pipeline, ML-Model-Efficiency-Toolkit
- **Classical/Domain ML:** Fraud-Detection-System, Churn-Intelligence-Engine, Sepsis-ML-Model
- **DS & Viz:** Data-Analytics-Portfolio
- **NLP:** NLP-Pipeline-at-Scale

---

## 5. The RAG engine

### 5.1 Build-time pipeline (Node script, runs in CI before deploy)
1. For each curated repo, gather source text: the repo `README.md`, the corresponding `WHAT AND WHY/<repo>` write-up (already authored), and `About_Me.md`.
2. Clean and **chunk** the text (paragraph/heading-aware, target ~200–400 tokens per chunk with small overlap).
3. Compute an embedding per chunk with `all-MiniLM-L6-v2` via **transformers.js** (same model used at runtime, so vectors are compatible).
4. Emit a single `public/search-index.json`:
   ```json
   {
     "model": "Xenova/all-MiniLM-L6-v2",
     "dim": 384,
     "chunks": [
       {
         "id": "cag-vs-rag-0",
         "repo": "CAG-vs-RAG-Showdown",
         "domain": "LLMs & GenAI",
         "url": "https://github.com/shiva-shivanibokka/CAG-vs-RAG-Showdown",
         "title": "CAG vs RAG Showdown",
         "text": "…chunk text…",
         "embedding": [/* 384 floats */]
       }
     ]
   }
   ```

### 5.2 Runtime (browser)
1. Lazy-load `search-index.json` and the MiniLM model (via transformers.js, cached by the browser after first load) when the user first interacts with the Ask box.
2. Embed the query with the same model.
3. **Cosine-similarity** retrieve top-k chunks (k≈3–5), optionally filtered by detected domain.
4. Render an **extractive answer**: the top chunks formatted into a readable response, deduped, each attributed to its source repo with a link. Show a short "Sources" list.
5. Graceful states: loading model, no good match (fallback message + link to Projects), and `prefers-reduced-motion` honored for the thinking animation.

### 5.3 Why this design
- No secrets to leak, nothing to pay for, nothing to keep running.
- It is genuinely real retrieval — survives inspection by a technical interviewer.
- Demonstrates embeddings, vector similarity, chunking, and client-side ML inference — all claimed on the résumé.

---

## 6. Visual design

**Direction:** dark, premium, "applied-AI lab" — Linear/Vercel-grade restraint with subtle data-viz accents. Explicitly *not* a terminal clone.

**Palette — "Technical yet Human" (Violet + Coral):**

| Token | Hex | Role |
|---|---|---|
| `base` | `#14131A` | warm-tinted charcoal background |
| `surface` | `#1C1B24` | cards / raised surfaces |
| `text` | `#ECE6DD` | warm ivory (deliberately not pure white) |
| `muted` | `#9A93A6` | secondary text, soft lavender-gray |
| `primary` | `#7C6CF0` | indigo-violet — intelligence / AI accent |
| `warm` | `#FF8A6B` | coral — CTAs, highlights, the "thinking" pulse |

**Principles:** cool structured base + warm neutrals + warm accent = technical but human. Warm-ivory text (not `#FFFFFF`) is a deliberate humanizing choice.

**Typography:** clean sans for UI/body (Inter or Geist), a monospace for code/metrics/citations.

**Motion:** subtle animated neural/particle motif behind the hero only, performance-budgeted; smooth scroll reveals; tasteful micro-interactions. All motion respects `prefers-reduced-motion`.

**Quality bar:** fully responsive, WCAG AA contrast, fast first paint (heavy RAG assets lazy-loaded after interaction).

---

## 7. Tech stack & architecture

- **Framework:** Vite + React + TypeScript.
- **Styling:** Tailwind CSS (theme tokens from Section 6).
- **Animation:** framer-motion.
- **ML:** `@xenova/transformers` (transformers.js) for embeddings at build time and runtime.
- **Content source of truth:** project metadata in a typed data file (`src/data/projects.ts`); RAG corpus from repo READMEs + `WHAT AND WHY` docs + `About_Me.md`.

**Component boundaries (each independently understandable/testable):**
- `rag/buildIndex.ts` — build-time indexer (Node).
- `rag/retriever.ts` — runtime: load index, embed query, cosine top-k. Pure, testable, no DOM.
- `components/AskBox` — hero chat UI; depends on `retriever`.
- `components/ProjectGrid` + `ProjectCard` — depends on `projects.ts`.
- `components/Experience`, `Skills`, `About`, `DomainsBand`, `Hero` — presentational, data-driven.
- `theme` — Tailwind config + tokens.

**Data flow:** `projects.ts` → section components (static render). Ask box → `retriever` → `search-index.json` (fetched once) → ranked chunks → answer view.

---

## 8. Hosting & deployment

- **Repo:** `shiva-shivanibokka.github.io` (GitHub user-site repo name required for root-domain Pages).
- **Deploy:** GitHub Actions workflow — install, run the build-time RAG indexer, `vite build`, publish to GitHub Pages.
- **URL:** https://shiva-shivanibokka.github.io ; optional custom domain later.

---

## 9. Error handling & edge cases

- Model/index fails to load → friendly inline error, Ask box degrades to linking the Projects section.
- Empty / no-match query → "I didn't find a strong match — browse projects" with chips.
- Slow first model load → visible progress + the coral pulse; box remains usable (queued).
- Reduced-motion / low-power devices → disable particle motif, keep everything functional.
- Mobile → Ask box and cards fully responsive; index lazy-loads only on interaction to protect mobile data.

---

## 10. Testing

- **Unit:** `retriever` cosine ranking on a tiny fixture index (known vectors → known order); chunker boundaries; query→answer assembly/dedup.
- **Build:** indexer produces valid `search-index.json` (schema, dim=384, non-empty embeddings) — fail CI otherwise.
- **Component:** AskBox states (idle/loading/answer/empty/error) render correctly.
- **Manual / a11y:** keyboard navigation, contrast (AA), reduced-motion, mobile layout, Lighthouse performance pass.

---

## 11. Scope & phasing

### Phase 1 (build now)
Full site (all sections) + working extractive RAG over the curated ~15–20 repos + GitHub Pages deploy.

### Later (deferred — explicitly out of Phase 1)
- Index all 55 repos.
- Per-project deep-dive pages with architecture diagrams.
- Optional on-device **generative** answers (WebLLM) behind an opt-in button.
- Light/dark toggle, visitor analytics, custom domain.

---

## 12. Success criteria

- A recruiter can ask a natural question and get a relevant, cited answer in seconds, on a phone.
- The breadth of AI/ML/DL/Agentic/NLP/MLOps/DS/Viz work is immediately legible.
- The site loads fast, looks premium, and is visibly *not* a template.
- A technical interviewer who inspects it concludes the RAG is real.
