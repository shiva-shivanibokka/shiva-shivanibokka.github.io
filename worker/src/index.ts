import { pickProvider, streamAnswer, type ProviderEnv, type Turn } from './providers'

// Chat endpoint for the portfolio. The browser does the retrieval — it already
// has the embedding model and the index loaded for the search box — and sends
// only the ids of the chunks it matched, plus which project the conversation
// has settled on. This Worker resolves those against its own copy of the
// corpus, assembles the prompt, and adds the API key.
//
// Keeping context assembly here rather than trusting the request body is the
// whole security design: the only free text a caller controls is the question
// itself, so the endpoint cannot be repurposed as a general LLM proxy.

export interface Env extends ProviderEnv {
  RATE: KVNamespace
  CORPUS_URL: string
  ALLOWED_ORIGINS: string
}

const MAX_QUESTION_CHARS = 600
const MAX_TURNS = 12
const MAX_CHUNKS = 12
const DAILY_LIMIT = 120
// A whole README, so that once the conversation is about one project, any
// follow-up about it is answerable without another retrieval round.
const MAX_FOCUS_CHUNKS = 24
const MAX_FOCUS_CHARS = 34_000

interface ChatChunk {
  repo: string
  title: string
  url: string
  text: string
}
interface CatalogEntry {
  title: string
  repo: string
  domain: string
  blurb: string
  tech: string[]
  url: string
  demo?: string
}
interface Corpus {
  bio: string
  contact?: { label: string; url: string }[]
  experience: { role: string; org: string; period: string; bullets: string[] }[]
  catalog: CatalogEntry[]
  chunks: Record<string, ChatChunk>
}

let corpusPromise: Promise<Corpus> | null = null
function getCorpus(env: Env): Promise<Corpus> {
  if (!corpusPromise) {
    corpusPromise = fetch(env.CORPUS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } })
      .then((r) => {
        if (!r.ok) throw new Error(`corpus fetch failed: ${r.status}`)
        return r.json() as Promise<Corpus>
      })
      .catch((e) => {
        corpusPromise = null
        throw e
      })
  }
  return corpusPromise
}

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  const ok = origin && allowed.includes(origin)
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

/** Every chunk belonging to one repo, in index order — i.e. its whole README. */
function fullReadme(corpus: Corpus, repo: string): { title: string; url: string; text: string } | null {
  const parts: ChatChunk[] = []
  for (const id of Object.keys(corpus.chunks)) {
    const c = corpus.chunks[id]
    if (c.repo === repo) parts.push(c)
    if (parts.length >= MAX_FOCUS_CHUNKS) break
  }
  if (!parts.length) return null
  let text = ''
  for (const p of parts) {
    if (text.length + p.text.length > MAX_FOCUS_CHARS) break
    text += (text ? '\n\n' : '') + p.text
  }
  return { title: parts[0].title, url: parts[0].url, text }
}

function systemPrompt(corpus: Corpus, chunks: ChatChunk[], focus: ReturnType<typeof fullReadme>, focusRepo: string | null): string {
  const catalog = corpus.catalog
    .map(
      (p) =>
        `- ${p.title} [${p.domain}] — ${p.blurb}\n  tech: ${p.tech.join(', ')}\n  repo: ${p.url}${p.demo ? `\n  live demo: ${p.demo}` : ''}`,
    )
    .join('\n')

  const experience = corpus.experience
    .map((e) => `- ${e.role}, ${e.org} (${e.period})\n  ${e.bullets.join('\n  ')}`)
    .join('\n')

  const contact = (corpus.contact ?? []).map((c) => `${c.label}: ${c.url}`).join(' · ')

  const focusBlock = focus
    ? `\n## COMPLETE README — ${focus.title} (${focusRepo})\n\nThe conversation is currently about this project, so you have its full documentation. Answer any question about it from here, in as much depth as asked.\n\n${focus.text}\n`
    : ''

  const readmes = chunks.length
    ? chunks.map((c) => `### ${c.title} (${c.repo})\n${c.text}`).join('\n\n')
    : '(nothing further retrieved for this turn)'

  return `You are the assistant on Shivani Bokka's portfolio site. You answer questions from recruiters, hiring managers and engineers about her work. Speak about her in the third person, as a well-briefed colleague would — never as Shivani herself.

Your purpose is to save the reader a trip to GitHub. Explain what a project actually does and what she actually built, so they never have to open a README themselves.

## Rules

1. Use ONLY the material below. It is the complete record of her public work. If something is not in it, say plainly that it is not covered here and point them at her GitHub or email — never guess, and never invent numbers, dates, employers or results.
2. Never state a metric, benchmark or figure unless it appears verbatim in the material.
3. Prefer her real project titles, and link the repo (and the live demo where one exists) the first time you name a project.
4. Be concrete about engineering: the problem, the approach, the notable decisions. Skip adjectives like "cutting-edge".
5. If asked to contact or hire her, or anything you cannot answer, give her email and LinkedIn: ${contact}

## How to shape an answer

**Broad questions** ("what AI projects has she built?", "does she know MLOps?") — give a short framing line, then a compact list. One project per line: the name as a link, then a single clause on what it does. Cover everything genuinely relevant from the catalog, not just the retrieved passages. Close by offering to go deeper, e.g. "Want detail on any of these?"

**Specific questions** ("tell me about the SWE agent", "how did the fraud detection work?") — go deep on that project: what problem it solves, how it is built, the interesting technical choices, what is deployed. Several paragraphs is right.

**Follow-ups** — this is the important one. When a reader stays on a project and asks progressively narrower questions ("how does it handle retries?", "what did she test?", "why that database?"), you usually have that project's COMPLETE README above. Answer from it directly and specifically, at whatever depth they ask, for as many turns as they want. Keep the thread; never re-introduce yourself, never repeat the overview they already read. If their question genuinely is not covered by the README, say exactly that rather than padding — then suggest the repo, where the code itself will have the answer.

**Comparisons** ("which of these use PyTorch?", "has she deployed anything?") — answer from the catalog, which lists tech and live demos for every project.

Format in plain markdown: short paragraphs, \`-\` bullets, \`**bold**\` for project names when not linking. No headings above level 3. Keep broad answers under about 200 words; detailed ones can run as long as the question deserves.

## Her background

${corpus.bio}

## Contact

${contact}

## Experience

${experience}

## Full project catalog (${corpus.catalog.length} projects — this is all of them)

${catalog}
${focusBlock}
## Other README passages retrieved for this question

${readmes}`
}

async function rateLimited(env: Env, ip: string): Promise<boolean> {
  const key = `rl:${new Date().toISOString().slice(0, 10)}:${ip}`
  const n = Number((await env.RATE.get(key)) ?? '0')
  if (n >= DAILY_LIMIT) return true
  await env.RATE.put(key, String(n + 1), { expirationTtl: 172800 })
  return false
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')
    const cors = corsHeaders(origin, env)
    const provider = pickProvider(env)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, configured: Boolean(provider), provider }), {
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      })
    }

    if (url.pathname !== '/chat' || request.method !== 'POST') {
      return new Response('Not found', { status: 404, headers: cors })
    }

    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    if (!origin || !allowed.includes(origin)) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    if (!provider) {
      return new Response(JSON.stringify({ error: 'Chat is not configured yet.' }), {
        status: 503,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown'
    if (await rateLimited(env, ip)) {
      return new Response(JSON.stringify({ error: 'Daily limit reached. Try again tomorrow, or email her directly.' }), {
        status: 429,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    let body: { messages?: Turn[]; chunkIds?: string[]; focusRepo?: string }
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const messages: Turn[] = (body.messages ?? [])
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_QUESTION_CHARS * 6) }))

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    messages[messages.length - 1].content = messages[messages.length - 1].content.slice(0, MAX_QUESTION_CHARS)

    let corpus: Corpus
    try {
      corpus = await getCorpus(env)
    } catch {
      return new Response(JSON.stringify({ error: 'Could not load the project corpus.' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // focusRepo is only ever used to look up her own repos, so a bogus value
    // resolves to nothing rather than injecting anything.
    const focusRepo = typeof body.focusRepo === 'string' ? body.focusRepo.slice(0, 120) : null
    const focus = focusRepo ? fullReadme(corpus, focusRepo) : null

    const chunks = (body.chunkIds ?? [])
      .slice(0, MAX_CHUNKS)
      .map((id) => corpus.chunks[id])
      .filter((c): c is ChatChunk => Boolean(c))
      // Whatever the focus project contributed is already present in full.
      .filter((c) => c.repo !== focusRepo)

    const result = await streamAnswer(provider, env, systemPrompt(corpus, chunks, focus, focusRepo), messages)
    if (!result.ok) {
      console.error('provider error', provider, result.status, result.detail)
      return new Response(JSON.stringify({ error: 'The model is unavailable right now.' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return new Response(result.stream, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  },
}
