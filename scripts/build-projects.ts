import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Domain, Project } from '../src/data/types'
import { firstParagraph, proseLength } from '../src/rag/markdown'

// Build the project list from GitHub for a CURATED set of repos. Everything
// *about* each project is still read from the repo at build time — blurb, tech
// stack, the outcome its README states, whether its demo is actually up — so
// improving a README still improves the card on the next build. What is no
// longer automatic is *which* repos are eligible. Writes
// src/data/projects.generated.ts.

const OWNER = 'shiva-shivanibokka'
const API = 'https://api.github.com'

// The portfolio is curated, not exhaustive, and the bar is that the project ran.
//
// Discovering every repo with a detailed README surfaced 57 of them, and most of
// what that added was coursework: a reader landing on the page had to sort the
// agent systems out of a dozen "learn X from scratch" notebooks before reaching
// anything built to answer a question. So the site shows the 25 below and
// nothing else — agentic work first, because that is the through-line.
//
// Every entry has measured results from a run that actually happened. Fourteen
// carry a full RESULTS.md evaluation on `main`; the rest have committed run
// artifacts. An evaluation harness with no executed run does not qualify —
// llm-hallucination-detection is the honest example, and its own README says it
// "reports no measured result of its own".
//
// Left out on purpose:
//   • Educational / tutorial repos — Dive-Deeper ×4, All-About-Cross-Validation,
//     Gradient-Descent-and-Optimizers, Data-Preprocessing, SQL-and-Database-Skills,
//     Core-algorithms-for-Leetcode, Games-built-using-Python, All-about-Neural-Networks,
//     Basics-of-Linear-and-Logistic-Regression, Transfer-Learning-HuggingFace,
//     Data-Analytics-Portfolio, Sepsis-ML-Model, dsa-dojo. They demonstrate a
//     technique rather than claim a result, so there is nothing in them to check.
//   • Ran nothing — llm-hallucination-detection, HireView, PrepGap-Lens,
//     ResumeForge, Wellnest, sobel-kernel-recovery, Super_Resolution_using_HAN.
//   • Folded into a bigger project — tool-dependency-graph, whose call-order work
//     lives inside CodePilot-SWE.
//   • Thin or unfinished — RecSys-Design, Huft-Refactored,
//     ML-System-Design-Batch-Inference.
//   • Infrastructure and trackers — this site, the profile README, build-log,
//     launchpad, mission-frontier, mission-control, residency-dojo,
//     portfolio-keepalive, todo.
//
// `pitch` and `finding` are written here rather than scraped, because scraping
// them produced the wrong text on exactly the projects that matter most. Four of
// these READMEs now open with a "the hosted backend is gone" notice — the free
// tiers expired — so first-paragraph extraction put a dead-demo warning on the
// card instead of the project. Multimodal-RAG, the strongest artefact here, was
// advertising a Google Cloud trial that closed in September. And the outcome
// extractor needs a unit-suffixed number in prose, so it found nothing at all in
// CodePilot-SWE, whose result is a table and a dollar figure.
//
// Each `finding` is the project's own measured claim, taken from its RESULTS.md
// or README. Nothing here is estimated or inferred, and the negative results are
// stated as negative — that is the point of them.
//
// Domain is declared here too. Keyword scoring filed most of the agent work
// under "LLMs & GenAI" — an agent repo says "RAG" and "embeddings" far more
// often than it says "agentic" — which buried the exact thing this page leads
// with.
//
// To change what the site shows, edit this list: membership and order are both
// display decisions, and both live here.
interface Curated {
  repo: string
  domain: Domain
  /** What it is, in one line. Replaces README first-paragraph extraction. */
  pitch: string
  /** The measured result, from the repo's own RESULTS.md or README. */
  finding?: string
  /**
   * A live deployment the repo's `homepage` field does not name — the replay
   * sites, mostly. Still liveness-checked like any other demo, so the link only
   * ships if it answered at build time.
   */
  demo?: string
  /**
   * The repo is private, so no GitHub link is emitted: a "View repo" that 404s
   * for every visitor is worse than no link at all. Tech cannot be detected from
   * a private README either, so a private entry declares its own.
   */
  private?: true
  tech?: string[]
  /**
   * No demo button, even though the repo names one and the page responds.
   * The Google Cloud free tier ended and these back ends were not moved to a
   * paid plan, so six front ends are now shells.
   * These are front ends whose back end was switched off when a free tier ended:
   * the page loads, then reports that it cannot do anything. checkLive only asks
   * whether a page answers, which is the wrong question for a site that answers
   * with "the model backend is offline". Linking it sends a reader to a dead end
   * with the project's name on it, which is worse than no link.
   */
  noDemo?: true
}

const CURATED: Curated[] = [
  // ─────────────── Agentic — the focus ───────────────
  {
    repo: 'CodePilot-SWE',
    domain: 'Agentic',
    pitch:
      'A coding agent that edits real git repositories, and a benchmark harness asking whether a model choosing its own next step beats a fixed, tool-free pipeline on real GitHub issues.',
    finding:
      'Agent resolved 5 of 10 SWE-bench Lite instances against agentless 1 of 10, all four discordant pairs favouring the agent — but exact McNemar p = 0.125, which is not significant, and the write-up says so. The agent cost 8.6× for 5× the resolutions, at $2.4892 over 588 calls.',
    demo: 'https://codepilot-swe-replay.vercel.app',
  },
  {
    repo: 'Autonomous-Research-Report-Agent',
    domain: 'Agentic',
    pitch:
      'A multi-agent pipeline that researches the open web and writes cited, quality-scored reports, with a critic loop and source triage.',
    finding:
      'The local correctness judges are invalid: they mark explicit refusals as CORRECT — llama3.1:8b 6 of 9, gemma2:9b 8 of 9 — and the two disagree on the sign of the effect. Separately, a cp1252 encoding error silently discarded every page for a sub-question; fixing it took extracted claims from 104 to 158, and all 36 runs logged no errors either way.',
  },
  {
    repo: 'SCM-using-MCP-and-LLM',
    // Checked 2026-10-12: the dashboard never gets past "Crunching the numbers".
    noDemo: true,
    domain: 'Agentic',
    pitch:
      'A pet-retail supply-chain platform where an MCP agent reasons over a live data warehouse and says what to do, not just what happened.',
    finding:
      'The forecasting gain is one season, not a model: CatBoost beats a 28-day moving average 13.24% against 14.77% sMAPE overall, but drop the single festival-season origin and it is indistinguishable, +0.17pp with CI [-0.17, +0.56]. Agent strict accuracy of 47.6% splits into lookup 91.7%, aggregation 52.1%, multi-hop 9.5%.',
  },
  {
    repo: 'Supply-Chain-Demand-Agent',
    domain: 'Agentic',
    pitch:
      'An agentic RAG pipeline for supply-chain demand forecasting, pairing a Temporal Fusion Transformer with retrieval over operational context.',
    finding:
      'The original comparison gave the baselines weekly seasonality on data with zero weekly pattern. Closing that gap, a yearly-Fourier baseline reaches MAE 6.673 against the TFT 6.862 — the TFT is 2.8% worse on point accuracy, where the earlier framing claimed 14% better. Its calibrated uncertainty does survive: 11.5% lower pinball loss at half the interval width.',
  },
  {
    repo: 'take-home-project',
    // Checked 2026-10-12: the board renders but makes no request to its database at all, so nothing can ever appear on it.
    noDemo: true,
    domain: 'Agentic',
    pitch:
      'Three cooperating agents research a topic, draft a structured brief, and review it — escalating low-confidence work to a human instead of publishing it.',
    finding:
      'The Reviewer’s own confidence predicts which briefs are wrong: single-call AUROC 0.778, CI [0.682, 0.864], against random, fewer-sources and shorter-brief baselines that all sit at chance. It is overconfident, ECE 0.28. The NLI judge was validated against human RAGTruth labels, failed, and is unused — no result here is validated by a human.',
  },
  {
    repo: 'Autonomous-ML-Pipeline-Builder',
    // Checked 2026-10-12: the page says "These controls need a backend, and this page does not have one".
    noDemo: true,
    domain: 'Agentic',
    pitch:
      'Upload a CSV, describe the problem in plain English, and a team of agents builds, evaluates and packages a deployable ML pipeline.',
    finding:
      'With a local 7B model the full agent pipeline failed outright on 9 of 15 datasets. On the 6 that completed it was not better than the same pipeline with the LLM steps removed: delta -0.012 AUC, Holm p = 0.47. An earlier +0.010 AUC win over default LightGBM did not replicate on 16 further CC18 datasets.',
  },
  {
    repo: 'Competitor-Insight-Engine',
    domain: 'Agentic',
    pitch:
      'Give it one company URL and an agent scrapes the site, finds real competitors via live search, and writes a competitive-intelligence report.',
    finding:
      'Retrieved search evidence gives no measurable gain over the model’s own parametric knowledge — P@4 +0.069, CI [-0.035, +0.177] on Haiku and +0.036, [-0.048, +0.119] on qwen — so the null replicates across two models and two providers. The model does read its evidence, since shuffling it drops P@4 to 0.028; the cause is retrieval coverage of 0.33.',
  },
  {
    repo: 'CodePilot-Agent',
    domain: 'Agentic',
    pitch:
      'The agent that came first: it reads code, edits it, runs the tests, and checkpoints every turn to a git ref so one command puts things back.',
    finding:
      'A model choosing each step beat a fixed plan/code/test/debug/review pipeline on the same 15 tasks, both solving 15 of 15: $0.042 against $0.184, 22s against 88s, and 75% against 56% correct on the first try. The loop is cheaper and faster, not just more flexible.',
  },
  {
    repo: 'unclaimed',
    domain: 'Agentic',
    pitch:
      'A voice agent that asks only the questions that change the answer, computes benefits eligibility with the PolicyEngine-US rules engine, and hands back a plan to apply.',
    finding:
      'Across 475 simulated households the question-selection engine made no false "you qualify" calls and missed no programs, while asking a median 54 questions against 71 for asking everything, and taking 11 conversational turns against 17.',
  },
  {
    repo: 'Autonomous-SWE-Agent',
    // Checked 2026-10-12: the page loads empty: "No run has been recorded yet".
    noDemo: true,
    domain: 'Agentic',
    pitch:
      'Takes a GitHub issue, writes a patch in an isolated workspace, and runs the repository’s own tests against it — built both as an agentic tool-use loop and as a fixed pipeline.',
    finding:
      'Recorded head-to-head runs on four SWE-bench instances, with per-instance cost and wall time for each arm. The evaluation also closed a leakage route — cloned workspaces carried post-base history — and made test grading match test ids exactly rather than loosely.',
  },

  // ─────────────── LLMs & GenAI ───────────────
  {
    repo: 'Multimodal-RAG',
    domain: 'LLMs & GenAI',
    pitch:
      'Don’t trust the LLM — verify it. Document QA that answers only what the documents support: every claim is checked against retrieved evidence by an NLI model, table math is computed rather than guessed, and each citation points at an exact pixel region of the source page.',
    finding:
      'The shipped refusal gate’s AUROC on near-domain OOD is 0.302, CI [0.198, 0.404] — entirely below chance — while the unshipped reranker logit reaches 0.632 on the same inputs. The system computes a working signal and discards it for one worse than a coin flip. Production hybrid+rerank R@1 of 0.832 is also not distinguishable from BM25 alone at 0.794.',
    demo: 'https://multimodal-rag-replay.vercel.app',
  },
  {
    repo: 'faultlines',
    domain: 'LLMs & GenAI',
    pitch:
      'M.S. capstone: a visual-analytics tool for the place where asking several language models stops working — when they all agree, and all of them are wrong.',
    finding:
      'Cross-model disagreement reaches AUC 0.840, CI [0.836, 0.845], against 0.778 for the best single-model semantic entropy on the same 6,436 questions and the same budget. The independence assumption fails: four models from different developers are wrong together 3.3× as often as it predicts, and 950 shared blind spots were found.',
    private: true,
    demo: 'https://faultlines-peach.vercel.app',
    tech: ['Python', 'TypeScript', 'Transformers', 'OpenAI', 'Anthropic', 'Gemini', 'D3.js', 'Next.js'],
  },
  {
    repo: 'RAG-vs-CAG-Showdown',
    domain: 'LLMs & GenAI',
    pitch:
      'A benchmarking framework that runs Context-Augmented Generation against Retrieval-Augmented Generation head to head on latency, token cost and judged answer quality.',
    finding:
      'Across five recorded tournaments the two are a wash on quality — on claude-sonnet-5, CAG 4.925 against RAG 4.975, with 8 of 10 questions tied — but CAG spends 20,610 input tokens per question against RAG’s 4,121 to get there.',
  },
  {
    repo: 'Fine-Tuned-Domain-LLM-QLoRA',
    domain: 'LLMs & GenAI',
    pitch:
      'Fine-tunes Llama 3.2 3B with QLoRA to extract specific clauses from real commercial contracts, with the whole train-evaluate-serve loop running on free tiers.',
    finding:
      'Fine-tuning made the surface metric worse, and the repo reports it: BERTScore F1 goes 0.490 base, 0.473 QLoRA, 0.469 QLoRA+DPO. What improved was hallucination rate, 0.845 to 0.818 to 0.815, with clause-presence accuracy flat at 0.983.',
  },

  // ─────────────── NLP ───────────────
  {
    repo: 'NLP-Pipeline-at-Scale',
    // Checked 2026-10-12: the page states "model backend offline — the demo below will not return results".
    noDemo: true,
    domain: 'NLP',
    pitch:
      'A real-time social-listening pipeline: Kafka ingest, one multi-task RoBERTa forward pass for sentiment, emotion and toxicity together, entity extraction with brand normalization, and anomaly alerts.',
    finding:
      'The published throughput measured nothing: ~1500 msg/s ran against a mock whose batch step was time.sleep. The real ceiling is 277-308 msg/s on an RTX 4060 and 9.2-12.7 on CPU — 4.2-4.6× and 101-139× optimistic. The multi-task ablation holds up: one shared backbone stays within 1.8 F1 on every task at 3.0× fewer parameters, and emotion improves while toxicity pays the whole cost.',
  },

  // ─────────────── ML system design ───────────────
  {
    repo: 'Search-Ranking-System',
    domain: 'ML System Design',
    pitch:
      'A full search and ranking stack over a ~1M passage index: query understanding, hybrid retrieval, learned ranking, and a feedback loop.',
    finding:
      'Every BM25 call site tokenized on whitespace, so punctuation stayed glued to words and the baseline was crippled everywhere. Fixing it inverted two documented conclusions: BM25 went 0.337 to 0.446, and the headline "~50% over BM25" became +16%, with the un-reranked hybrid now best — the rerankers do not earn their cost. The corrected BM25 lands within 0.0001-0.020 of published BEIR baselines on all three datasets.',
  },
  {
    repo: 'ML-System-Design-Retraining-Pipeline',
    domain: 'ML System Design',
    pitch:
      'An automated model-lifecycle system for a credit-risk LightGBM model: drift detection, retraining, a promotion gate, and fairness reporting.',
    finding:
      'The drift trigger fires on 36 of 36 batches. A rolling-reference sweep showed the frozen 2015 window explained the magnitude but not the rate — the rule counted KS significance with no effect-size floor, making it a sample-size detector — and neither fix works alone. The promotion gate also compared an in-sample champion to an out-of-sample challenger, with holdout rows overlapping training rows 26.1% on average.',
  },
  {
    repo: 'ML-System-Design-Feature-Store',
    // Checked 2026-10-12: the dashboard loads and then sits on "waking up", because its Cloud Run API and Aiven Valkey are both gone.
    noDemo: true,
    domain: 'ML System Design',
    pitch:
      'A feature store on the Uber Michelangelo / Feast / Tecton pattern, with one SQL definition per feature feeding both training and serving — running entirely on free tiers.',
    finding:
      'The README claimed training and serving values were "impossible to drift apart by construction". The same entity, queried seconds apart through the two paths, returned txn_count_30d 2.0 against 0.0 and days_since_last_txn 15.0 against 101.0. Three of its four headline claims were falsifiable in under a minute, two by running the commands the README itself gives.',
  },
  {
    repo: 'ML-System-Design-Model-Serving',
    domain: 'ML System Design',
    pitch:
      'A model-deployment system built around the shadow → canary → full rollout question, with real DistilBERT inference and drift monitoring behind it.',
    finding:
      'One early `return` cancelled the canary, shadow mode and drift detection at once: the cache was checked before routing, so on a hit the router never ran. At a 50% canary split, 60 identical requests never once reached v2. All three mechanisms the project exists to demonstrate were broken.',
  },
  {
    repo: 'ML-System-Design-Recommendation-Engine',
    domain: 'ML System Design',
    pitch:
      'A five-stage serving pipeline for the "design Netflix recommendations" question, with running code: cache, FAISS retrieval, feature fetch, neural ranking, business rules.',
    finding:
      'Neural collaborative filtering earns its complexity over a linear baseline on the shortlist it reranks: NeuMF reaches 0.670 against TruncatedSVD’s 0.629, and 0.449 against 0.378 on the second metric, with MMR diversity re-ranking and a hard genre cap on top.',
  },

  // ─────────────── MLOps ───────────────
  {
    repo: 'Fraud-Detection-System',
    domain: 'MLOps',
    pitch:
      'Two modules for two different problems: a deployed real-time scoring API with calibrated XGBoost, conformal uncertainty and counterfactual explanations, plus a graph-neural-network module benchmarking static against temporal GNNs.',
    finding:
      'On severely imbalanced data the honest metric is AUC-PR, and it reports 0.314 against a 0.49% base rate — roughly a 64× lift — rather than leaning on the 0.950 AUC-ROC. Precision@1% is 0.236, and recall at a 1-in-1000 false-block rate is 0.176.',
  },
  {
    repo: 'ML-Model-Efficiency-Toolkit',
    domain: 'MLOps',
    pitch:
      'Benchmarks every major neural-network compression technique side by side, so the size/latency/accuracy tradeoff is measured instead of guessed.',
    finding:
      'Eleven configurations across vision and NLP, every number from a real RTX 4060 run: static post-training INT8 quantization holds 91.35% accuracy at 24.1 MB — a 74.5% size cut — for a 1.97× speedup with no accuracy loss. A configuration with no trained checkpoint shows an em dash rather than a number.',
    // Live, but the repo's homepage field was never set, so discovery missed it.
    demo: 'https://ml-model-efficiency-toolkit.vercel.app',
  },

  // ─────────────── Modeling ───────────────
  {
    repo: 'Churn-Intelligence-Platform',
    domain: 'Classical ML',
    pitch:
      'Segments customers behaviorally, predicts churn per cohort with calibrated probabilities, picks the subset worth retention budget via uplift modeling, and puts a 12-tool ReAct agent over SHAP drivers and ROI.',
    finding:
      'Uplift measured on the Hillstrom randomized set with a checksummed download, and the bootstrap raised from 500 to 5,000 resamples because a conclusion rested on a bound inside the Monte-Carlo error of 500. The evaluation added 46 reproduction tests, 73 to 119 passing, each pinning a defect before it was fixed. No paid API, no LLM judge.',
  },
  {
    repo: 'Federated-Learning-Simulation',
    domain: 'Deep Learning',
    pitch:
      'Trains a heart-disease model across simulated hospitals without pooling their data, then shows interactively that the shared gradients still leak.',
    finding:
      'Federated training matches centralized exactly at 83.3% accuracy, against 57.3% for local-only — so collaboration is worth 26 points without sharing data. But a gradient-inversion attack rebuilds a patient record to a reconstruction error of ~1.98e-12, and differential privacy raises that to 0.165, defeating the same attack.',
  },
  {
    repo: 'RL-Portfolio-Optimization',
    domain: 'Deep Learning',
    pitch:
      'Three reward-shaped PPO agents allocating a portfolio, trained offline on real ETF data and served with no PyTorch in production.',
    finding:
      'All three agents underperform both passive baselines out of sample, and the repo says so: +10% to +35% total return against equal-weight +57% and SPY +117%. What reward shaping does deliver is a strictly monotonic risk spectrum, and the Conservative agent holds the lowest max drawdown of any strategy in the table at -20%, beating SPY.',
  },
]

// A curated repo whose README has lost its prose is worth a warning: the tech
// tags are detected from it, so a gutted README quietly thins a card.
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

// Present in almost every Python repo, so they say nothing about what a project
// IS. Kept — they are true — but ranked last, because a reader scanning tags
// should meet the distinctive ones first. "LangGraph, QLoRA, FAISS" describes a
// project; "NumPy, pandas, Matplotlib" describes Python.
const GENERIC_TECH = new Set([
  'NumPy',
  'pandas',
  'Matplotlib',
  'Seaborn',
  'SciPy',
  'pytest',
  'Docker',
  'Vite',
  'Axios',
  'Zod',
  'Vercel',
  'Netlify',
  'Bootstrap',
  'Express',
  'Node.js',
])

function detectTech(hay: string, langs: string[]): string[] {
  const cleanLangs = langs.filter((l) => !SKIP_LANG.has(l.toLowerCase())).slice(0, 3)
  const frameworks = TECH.filter(([, kws]) => kws.some((k) => hit(hay, k))).map(([name]) => name)
  const distinctive = frameworks.filter((t) => !GENERIC_TECH.has(t))
  const generic = frameworks.filter((t) => GENERIC_TECH.has(t))
  // Languages first (GitHub measured them, so they are the least disputable),
  // then what makes this project itself, then the background noise.
  return [...new Set([...cleanLangs, ...distinctive, ...generic])].slice(0, 10)
}

// What came of it. Purely an extraction — if a README does not state an outcome,
// the card shows none, because the alternative is inventing one. Looks for a
// results-flavoured section first, then falls back to any sentence carrying a
// hard number, which is what a claim about outcomes nearly always contains.
const OUTCOME_HEADING = /^#{2,4}\s*(?:📊\s*)?(results?|outcomes?|performance|benchmarks?|impact|key findings?)\b.*$/im
const HAS_NUMBER = /\b\d[\d,.]*\s*(%|x\b|ms\b|s\b|k\b|m\b|gb\b|mb\b|hours?\b|minutes?\b|seconds?\b|pp\b|points?\b)/i
// Vocabulary that means a measurement was taken, rather than a fact stated.
const MEASURED =
  /\b(accuracy|auc|auc-?roc|auc-?pr|f1|precision|recall|rmse|mae|mape|bleu|rouge|perplexity|latency|throughput|speed-?up|reduc\w+|improv\w+|outperform\w+|beats?|achiev\w+|scores?|lift|baseline|benchmark\w*|faster|slower|smaller|cheaper|hit rate|win rate|pass@)\b/i

function cleanSentence(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*[-*+]\s+/, '') // list marker, wherever the line came from
    .replace(/[*_`>#|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// "Measured on the real KKBox data:" introduces the numbers, it is not itself a
// result. A line that trails off into a colon is always a lead-in to a table or
// list we are not going to show.
function isLeadIn(s: string): boolean {
  return /[:;]$/.test(s)
}

function extractOutcome(readme: string): string | undefined {
  const m = OUTCOME_HEADING.exec(readme)
  if (m) {
    const after = readme.slice(m.index + m[0].length)
    // Stop at the next heading so we stay inside the results section.
    const section = after.split(/\n#{1,4}\s/)[0]
    for (const raw of section.split('\n')) {
      const line = cleanSentence(raw.replace(/^[-*+]\s*/, ''))
      // A results section usually opens with housekeeping — "all figures below
      // are reproducible from a clean clone" — before it says anything. Skip
      // ahead to a line that actually carries a figure.
      if (line.length >= 40 && line.length <= 220 && !/^\|/.test(raw) && !isLeadIn(line) && HAS_NUMBER.test(line)) {
        return line
      }
    }
  }
  for (const raw of readme.split(/\n\n+/)) {
    if (/^\s*[#|>`]/.test(raw)) continue
    for (const sentence of cleanSentence(raw).split(/(?<=[.!?])\s+/)) {
      const s = sentence.replace(/^\s*[-*+]\s+/, '') // bullets survive a collapsed list
      // A number alone is not a result — "100% client-side" and "needs 4 GB RAM"
      // both match one. Require a word that means something was *measured*, or
      // this fills the page with descriptions wearing a Result label.
      if (s.length >= 45 && s.length <= 220 && HAS_NUMBER.test(s) && MEASURED.test(s) && !isLeadIn(s)) return s
    }
  }
  return undefined
}

function slugify(repo: string): string {
  return repo.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const outFile = path.resolve(here, '..', 'src', 'data', 'projects.generated.ts')

  const repos = await listRepos()
  console.log(`Found ${repos.length} public repos for @${OWNER}; ${CURATED.length} curated`)
  const byKey = new Map(repos.map((r) => [r.name.toLowerCase(), r]))

  const shown: Project[] = []
  const dead: string[] = []
  // A curated repo that produces no card is a mistake to go fix — a rename, a
  // repo flipped private, a README that lost its prose — not a quiet omission.
  // Collected and reported rather than thrown: one stale entry should not take
  // the whole site build down with it.
  const skipped: string[] = []
  const thin: string[] = []
  let live = 0
  // CURATED order is display order, so walk it rather than the API's pushed-at
  // ordering.
  for (const c of CURATED) {
    const r = byKey.get(c.repo.toLowerCase())
    if (!r && !c.private) {
      skipped.push(`${c.repo}: not among @${OWNER}'s public repos (renamed, deleted, or now private?)`)
      continue
    }
    if (r && (r.fork || r.archived)) {
      skipped.push(`${c.repo}: ${r.fork ? 'fork' : 'archived'}`)
      continue
    }
    // A private entry declares its own tech, because its README cannot be read.
    // A public one gets tech detected from README + topics + description + the
    // repo's real languages + dependency manifests (the libraries it imports).
    let tech = c.tech ?? []
    if (r) {
      const readme = await fetchReadme(r.name)
      if (proseLength(readme) < MIN_README_CHARS) thin.push(`${c.repo} (${proseLength(readme)} chars of prose)`)
      const langs = await fetchLanguages(r.name)
      const manifests = await fetchManifests(r.name)
      const hay = `${r.name} ${(r.topics || []).join(' ')} ${r.description || ''} ${langs.join(' ')} ${readme}\n${manifests}`.toLowerCase()
      const detected = detectTech(hay, langs)
      if (detected.length) tech = detected
    }
    // The declared demo wins over the repo's homepage field — it is the one
    // chosen for the card, usually a replay the homepage does not name. Either
    // way it ships only if it answered just now.
    const candidate = c.noDemo ? null : (c.demo ?? demoCandidate(c.repo, r?.homepage ?? null))
    let demo: string | undefined
    if (candidate) {
      if (await checkLive(candidate)) {
        demo = candidate
        live++
      } else {
        dead.push(`${c.repo} → ${candidate}`)
      }
    }
    shown.push({
      slug: slugify(c.repo),
      title: prettyTitle(c.repo),
      repo: c.repo,
      domain: c.domain,
      blurb: c.pitch,
      tech: tech.length ? tech : ['Project'],
      ...(c.private ? {} : { url: `https://github.com/${OWNER}/${c.repo}` }),
      ...(demo ? { demo } : {}),
      ...(c.finding ? { outcome: c.finding } : {}),
    })
  }

  const withOutcome = shown.filter((p) => p.outcome).length
  console.log(`  ${shown.length} shown of ${CURATED.length} curated`)
  console.log(`  ${live} live demos linked`)
  console.log(`  ${withOutcome} state a measured finding`)
  if (skipped.length) console.warn(`  ${skipped.length} curated repo(s) produced no card:\n    ${skipped.join('\n    ')}`)
  // Tech tags come from the README, so a gutted one thins a card without
  // emptying it. Worth saying; not worth dropping the project over.
  if (thin.length) console.warn(`  ${thin.length} README(s) under ${MIN_README_CHARS} chars of prose, tech tags may be sparse:\n    ${thin.join('\n    ')}`)
  // Never drop a demo silently — an unreachable one is a thing to go fix.
  if (dead.length) console.warn(`  ${dead.length} demo(s) unreachable, link omitted:\n    ${dead.join('\n    ')}`)

  const body =
    `import type { Project } from './types'\n\n` +
    `// AUTO-GENERATED by scripts/build-projects.ts — do not edit by hand.\n` +
    `// Curated list — membership, order, blurb and outcome come from CURATED in that\n` +
    `// script; tech tags and demo liveness are read from each repo at build time.\n` +
    `export const generatedProjects: Project[] = ${JSON.stringify(shown, null, 2)}\n`
  await fs.writeFile(outFile, body)
  console.log(`Wrote ${shown.length} projects → src/data/projects.generated.ts`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
