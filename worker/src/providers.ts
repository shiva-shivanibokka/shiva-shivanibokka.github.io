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

/** Pull `data:` payloads out of an SSE byte stream, one JSON object at a time. */
async function* sseObjects(body: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let cut: number
    while ((cut = buf.indexOf('\n\n')) !== -1) {
      const block = buf.slice(0, cut)
      buf = buf.slice(cut + 2)
      for (const line of block.split('\n')) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        if (!raw || raw === '[DONE]') continue
        try {
          yield JSON.parse(raw)
        } catch {
          // partial or non-JSON keepalive — skip
        }
      }
    }
  }
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
      body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: MAX_TOKENS, system, messages: turns, stream: true }),
    })
  }

  if (provider === 'groq') {
    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.GROQ_API_KEY!}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: MAX_TOKENS,
        stream: true,
        messages: [{ role: 'system', content: system }, ...turns],
      }),
    })
  }

  // Gemini: system prompt is its own field, and the assistant role is "model".
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${env.GEMINI_API_KEY!}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: turns.map((t) => ({ role: t.role === 'assistant' ? 'model' : 'user', parts: [{ text: t.content }] })),
        generationConfig: { maxOutputTokens: MAX_TOKENS, temperature: 0.3 },
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
      try {
        for await (const obj of sseObjects(body)) {
          const t = textFrom(provider, obj)
          if (t) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t })}\n\n`))
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
