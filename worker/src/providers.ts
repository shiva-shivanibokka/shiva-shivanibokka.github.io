// Provider adapters. Each takes the assembled prompt and returns a stream of
// plain text fragments, so the browser only ever parses one format regardless
// of who generated the words.
//
// Chosen by whichever key is present, cheapest-to-run first. Gemini and Groq
// both have free tiers that need no card; Anthropic is the paid upgrade. The
// point of the ordering is that the site works on a free key and can be moved
// up later by adding a secret and nothing else.

export interface ProviderEnv {
  GEMINI_API_KEY?: string
  GROQ_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  // Optional pins, so a model can be changed with `wrangler deploy` and no code
  // edit. Gemini defaults to the tracking alias on purpose: dated model ids get
  // retired to new keys without warning, which is exactly how this broke once.
  GEMINI_MODEL?: string
  GROQ_MODEL?: string
  ANTHROPIC_MODEL?: string
}

export type ProviderName = 'gemini' | 'groq' | 'anthropic'

export function pickProvider(env: ProviderEnv): ProviderName | null {
  if (env.ANTHROPIC_API_KEY) return 'anthropic'
  if (env.GEMINI_API_KEY) return 'gemini'
  if (env.GROQ_API_KEY) return 'groq'
  return null
}

export interface Turn {
  role: 'user' | 'assistant'
  content: string
}

const MAX_TOKENS = 1600

/**
 * Pull `data:` payloads out of an SSE byte stream, one JSON object at a time.
 *
 * Deliberately line-oriented rather than event-oriented. Splitting on a blank
 * line is the textbook reading of SSE, but providers differ on whether they
 * send a trailing one, and a stream that ends without it leaves its last — or
 * only — event stranded in the buffer, which reads from outside as a perfectly
 * successful response containing no words. Working a line at a time, and
 * flushing whatever is left when the stream closes, handles every shape.
 */
async function* sseObjects(body: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  function* take(line: string): Generator<unknown> {
    const t = line.trim()
    if (!t.startsWith('data:')) return
    const raw = t.slice(5).trim()
    if (!raw || raw === '[DONE]') return
    try {
      yield JSON.parse(raw)
    } catch {
      // a keepalive or a fragment that is not JSON on its own — skip it
    }
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let nl: number
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl)
      buf = buf.slice(nl + 1)
      yield* take(line)
    }
  }
  buf += decoder.decode()
  if (buf.trim()) yield* take(buf)
}

function textFrom(provider: ProviderName, obj: any): string | null {
  if (provider === 'anthropic') {
    if (obj?.type === 'content_block_delta' && obj?.delta?.type === 'text_delta') return obj.delta.text
    return null
  }
  if (provider === 'groq') {
    return obj?.choices?.[0]?.delta?.content ?? null
  }
  // gemini
  const parts = obj?.candidates?.[0]?.content?.parts
  if (Array.isArray(parts)) return parts.map((p: any) => p?.text ?? '').join('') || null
  return null
}

async function callUpstream(provider: ProviderName, env: ProviderEnv, system: string, turns: Turn[]): Promise<Response> {
  if (provider === 'anthropic') {
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: env.ANTHROPIC_MODEL || 'claude-sonnet-5', max_tokens: MAX_TOKENS, system, messages: turns, stream: true }),
    })
  }

  if (provider === 'groq') {
    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY!}` },
      body: JSON.stringify({
        model: env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        max_tokens: MAX_TOKENS,
        stream: true,
        messages: [{ role: 'system', content: system }, ...turns],
      }),
    })
  }

  // Gemini: system prompt is its own field, and the assistant role is "model".
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL || 'gemini-flash-latest'}:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY!}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })),
        // Current Gemini flash models think before answering, and those thoughts
        // are billed against maxOutputTokens — at 1600 the whole budget went to
        // thinking and the stream arrived with no text in it at all. Turning
        // thinking off outright is rejected by this model, so the budget is
        // simply wide enough that thoughts cannot starve the answer. Length is
        // governed by the prompt, not by this ceiling.
        generationConfig: { maxOutputTokens: MAX_TOKENS * 5, temperature: 0.3 },
      }),
    },
  )
}

/**
 * Streams the answer as `data: {"t":"..."}` lines — one shape for every
 * provider, so swapping keys never touches the client.
 */
export async function streamAnswer(
  provider: ProviderName,
  env: ProviderEnv,
  system: string,
  turns: Turn[],
): Promise<{ ok: true; stream: ReadableStream } | { ok: false; status: number; detail: string }> {
  const upstream = await callUpstream(provider, env, system, turns)
  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '')
    return { ok: false, status: upstream.status, detail: detail.slice(0, 400) }
  }

  const encoder = new TextEncoder()
  const body = upstream.body
  const stream = new ReadableStream({
    async start(controller) {
      let emitted = 0
      let lastObj: unknown = null
      try {
        for await (const obj of sseObjects(body)) {
          lastObj = obj
          const t = textFrom(provider, obj)
          if (t) {
            emitted += t.length
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t })}\n\n`))
          }
        }
        // A 200 that produced no words is the failure mode worth seeing in the
        // logs: a safety block, a budget spent entirely on thinking, and a shape
        // change upstream all look identical from outside.
        if (emitted === 0) {
          console.error('empty completion', provider, JSON.stringify(lastObj)?.slice(0, 600))
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'The model returned an empty answer. Try rephrasing.' })}\n\n`),
          )
        }
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'The answer was cut short.' })}\n\n`))
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })
  return { ok: true, stream }
}
