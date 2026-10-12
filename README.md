# shiva-shivanibokka.github.io

My personal AI/ML portfolio. Live at **[shiva-shivanibokka.github.io](https://shiva-shivanibokka.github.io)**.

The hero isn't a list of links — it's a **real, in-browser semantic search over my own work**. You type a query in plain English ("RAG projects", "deep learning", "MLOps"), and the page embeds your query and ranks my repositories by meaning, showing the most relevant projects with the matching snippets and a cosine similarity score. No server, no API keys, no LLM calls — the embedding model runs entirely in your browser.

---

## What it does

- **Semantic search over my repos.** A sentence-transformer (`Xenova/all-MiniLM-L6-v2`, 384-dim) embeds the query in-browser, then cosine-ranks chunks of my repo READMEs and surfaces the best-matching projects, each with a snippet and a match score (e.g. `0.45 match`). It's honest retrieval — there is **no generative LLM** writing answers.
- **"Connecting the Dots" embedding map.** A real 2D projection (PCA of per-repo mean embeddings) renders my repositories as an interactive constellation. Nodes are colored by domain, hover reveals the repo, click opens it, and the nodes **pulse when a search runs** so you can see which projects matched.
- **"Hiring for…" role lens.** Pick a role (ML Engineer / Data Scientist / Deep Learning / GenAI·Agentic / SWE) and the Projects section refocuses on the relevant work.
- **The rest:** a glitchy animated hero, a Netflix-style particle intro (skippable, runs once per session, reduced-motion safe), real experience & skills, and a downloadable résumé.

## How the search works

1. **The project list is curated, and the rest builds itself** (`npm run build:projects`). `CURATED` in `scripts/build-projects.ts` names the 25 projects the site shows, in display order, each with a one-line pitch, its measured finding, and its domain. The bar for inclusion is that the project *ran*: fourteen carry a full `RESULTS.md` evaluation, the rest have committed run artifacts, and an evaluation harness that was never executed does not qualify. Everything else is still read from GitHub on each build — the tech stack from each repo's README, topics, languages and dependency manifests, and whether its demo is still answering. Discovery used to pick up every repo with a detailed README, which surfaced 57 and buried the agent work under coursework. The result is written to `src/data/projects.generated.ts`.
2. **The index is embedded** (`npm run build:index`). Each of those repos' READMEs is fetched live from the GitHub API, stripped of markdown, chunked, and embedded. The vectors are written to `public/search-index.json`, and `scripts/build-map.ts` computes the 2D embedding map into `public/embedding-map.json`.
3. **In the browser**, the model is loaded once (cached afterward), the query is embedded, and results are cosine-ranked against the prebuilt index — all client-side.

Because both the project list and the index are rebuilt from live GitHub data, adding a repo with a solid README makes it appear on the site automatically, and improving a README improves how it shows up here.

## Tech stack

| Layer | Choice |
|-------|--------|
| Build / dev | **Vite** |
| UI | **React 18 + TypeScript** |
| Styling | **Tailwind CSS** |
| Animation | **framer-motion** + canvas |
| ML in-browser | **transformers.js** (`@xenova/transformers`) |
| Embeddings | `Xenova/all-MiniLM-L6-v2` (384-dim, ONNX, runs client-side) |
| Tests | **Vitest** + Testing Library |
| Hosting / CI | **GitHub Pages** via GitHub Actions |

Fonts: **Bungee Shade** (display) and **JetBrains Mono** (body). Palette is a dark violet/coral/mint theme defined in `tailwind.config.ts`.

## Project structure

```
src/
  components/      UI: Hero, AskBox (search console), LatentSpace (embedding map),
                   ProjectGrid, Experience, Skills, About, Nav, Intro, backgrounds
  rag/             retriever, answer builder, chunking, index types  (the search core)
  hooks/           useRetriever (runs a query, lights up the map), reduced-motion
  data/            content.ts (experience/skills/bio), projects.generated.ts (auto-built list)
scripts/
  build-projects.ts  curated list + live repo metadata        -> src/data/projects.generated.ts
  build-index.ts     fetch live READMEs -> chunk -> embed -> public/search-index.json
  build-map.ts       PCA of repo embeddings -> public/embedding-map.json
public/
  search-index.json    prebuilt embeddings (generated)
  embedding-map.json   2D map nodes (generated)
  resume.pdf           downloadable résumé
  models/              vendored embedding model files
.github/workflows/
  deploy.yml       build + deploy on push; biweekly index refresh from live READMEs
```

## Run it locally

```bash
npm install
npm run dev          # start the dev server
npm run build        # build:projects + build:index + typecheck + bundle
npm run preview      # preview the production build
npm test             # run the test suite
```

> Note: the first search in a fresh browser downloads the ~23 MB embedding model once, then caches it. Give it a couple of seconds the very first time.

## Deployment

Pushing to `main` triggers `deploy.yml`, which reinstalls, **rebuilds the project list and search index from the live GitHub READMEs**, typechecks, builds, and publishes to GitHub Pages. A scheduled biweekly run refreshes the index only when a README has actually changed (gated on a corpus signature) so the site stays in sync with my repositories without redundant deploys.

To update content: edit the relevant file (or `public/resume.pdf`) and push to `main`.
