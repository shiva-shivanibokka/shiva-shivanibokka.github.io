// Chat endpoint for the portfolio. The browser does the retrieval — it already
// has the embedding model and the index loaded for the search box — and sends
// only the ids of the chunks it matched. This Worker resolves those ids against
// its own copy of the corpus, assembles the prompt, and adds the API key.
//
// Keeping context assembly here rather than trusting the request body is the
// whole security design: the only free text a caller controls is the question
// itself, so the endpoint cannot be repurposed as a general LLM proxy.

export interface Env {
  ANTHROPIC_API_KEY: string
  RATE: KVNamespace
  CORPUS_URL: string
  ALLOWED_ORIGINS: string
}

const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 1400
const MAX_QUESTION_CHARS = 600
const MAX_TURNS = 12 // user+assistant messages kept from the conversation
const MAX_CHUNKS = 12
const DAILY_LIMIT = 120 // per IP; a real reader never approaches this

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
  experience: { role: string; org: string; period: string; bullets: string[] }[]
  catalog: CatalogEntry[]
  chunks: Record<string, ChatChunk>
}

// Fetched once per isolate. Cloudflare keeps isolates warm across requests, so
// in practice this is one fetch per deployment rather than one per question.
let corpusPromise: Promise<Corpus> | null = null
function getCorpus(env: Env): Promise<Corpus> {
  if (!corpusPromise) {
    corpusPromise = fetch(env.CORPUS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } })
      .then((r) => {
        if (!r.ok) throw new Error(`corpus fetch failed: ${r.status}`)
        return r.json() as Promise<Corpus>
      })
      .catch((e) => {
        corpusPromise = null // don't cache a failure for the life of the isolate
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function systemPrompt(corpus: Corpus, chunks: ChatChunk[]): string {
  const catalog = corpus.catalog
    .map(
      (p) =>
        `- ${p.title} [${p.domain}] — ${p.blurb}\n  tech: ${p.tech.join(', ')}\n  repo: ${p.url}${p.demo ? `\n  live demo: ${p.demo}` : ''}`,
    )
    .join('\n')

  const experience = corpus.experience
    .map((e) => `- ${e.role}, ${e.org} (${e.period})\n  ${e.bullets.join('\n  ')}`)
    .join('\n')

  const readmes = chunks.length
    ? chunks.map((c) => `### ${c.title} (${c.repo})\n${c.text}`).join('\n\n')
    : '(no specific README passages were retrieved for this question)'

  return `You are the assistant on Shivani Bokka's portfolio site. You answer questions from recruiters, hiring managers and engineers about her work. Speak about her in the third person, as a well-briefed colleague would — never as Shivani herself.

Your purpose is to save the reader a trip to GitHub. Explain what a project actually does and what she actually built, so they never have to open a README themselves.

## Rules

1. Use ONLY the material below. It is the complete record of her public work. If something is not in it, say plainly that it is not covered here and point them at her GitHub or email — never guess, and never invent numbers, dates, employers or results.
2. Never state a metric, benchmark or figure unless it appears verbatim in the material.
3. Prefer her real project titles, and link the repo (and the live demo where one exists) the first time you name a project.
4. Be concrete about engineering: the problem, the approach, the notable decisions. Skip adjectives like "cutting-edge".

## How to shape an answer

**Broad questions** ("what AI projects has she built?", "does she know MLOps?") — give a short framing line, then a compact list. One project per line: the name as a link, then a single clause on what it does. Cover everything genuinely relevant from the catalog, not just the retrieved passages. Close by offering to go deeper, e.g. "Want detail on any of these?"

**Specific questions** ("tell me about the SWE agent", "how did the fraud detection work?") — go deep on that project: what problem it solves, how it is built, the interesting technical choices, what is deployed. Several paragraphs is right. Draw on the README passages, which carry far more detail than the catalog blurbs.

**Follow-ups** — when they name one of the projects you just listed, treat it as a request for the deep version. Keep the thread; do not re-introduce yourself.

Format in plain markdown: short paragraphs, \`-\` bullets, \`**bold**\` for project names when not linking. No headings above level 3. Keep broad answers under about 200 words; detailed ones can run longer.

## Her background

${corpus.bio}

## Experience

${experience}

## Full project catalog (${corpus.catalog.length} projects — this is all of them)

${catalog}

## README passages retrieved for this question

${readmes}`
}

async function rateLimited(env: Env, ip: string): Promise<boolean> {
  // Coarse on purpose: a per-day counter per IP, cheap enough for the KV free
  // tier. It exists to bound the bill if someone scripts against the endpoint,
  // not to be an exact quota.
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

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

    const url = new URL(request.url)

    // Cheap, unmetered probe. The site hides the chat tab entirely unless this
    // says the key is present, so a missing key or an exhausted account shows
    // no broken feature to a visitor — the tab simply isn't there.
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, configured: Boolean(env.ANTHROPIC_API_KEY) }), {
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

    if (!env.ANTHROPIC_API_KEY) {
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

    let body: { messages?: { role: string; content: string }[]; chunkIds?: string[] }
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const messages = (body.messages ?? [])
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content.slice(0, MAX_QUESTION_CHARS * 4) }))

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return new Response(JSON.stringify({ error: 'Bad request' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    // Only the newest question is user-controlled free text worth clamping hard;
    // earlier turns are echoes of what this endpoint already produced.
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

    const chunks = (body.chunkIds ?? [])
      .slice(0, MAX_CHUNKS)
      .map((id) => corpus.chunks[id])
      .filter((c): c is ChatChunk => Boolean(c))

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt(corpus, chunks),
        messages,
        stream: true,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => '')
      console.error('anthropic error', upstream.status, detail.slice(0, 500))
      return new Response(JSON.stringify({ error: 'The model is unavailable right now.' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    // Pass the SSE stream straight through; the client pulls text deltas out of it.
    return new Response(upstream.body, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  },
}
