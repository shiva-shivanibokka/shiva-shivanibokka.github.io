import { Retriever } from '../rag/retriever'

// Talking to the chat Worker. The retrieval half stays here in the browser —
// the embedding model and index are already loaded for the search box — so all
// that crosses the wire is the conversation plus the ids of the chunks that
// matched. The Worker resolves those ids against its own copy of the corpus.

export const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT ?? 'https://portfolio-chat.shivani-bokka93.workers.dev/chat'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * Is the chat backend deployed AND holding an API key? The tab stays hidden
 * unless this is true, so the site never offers a feature that will error —
 * whether the key was never set, was rotated, or the account ran dry.
 */
export async function chatAvailable(): Promise<boolean> {
  try {
    const res = await fetch(CHAT_ENDPOINT.replace(/\/chat$/, '/health'), { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return false
    return Boolean((await res.json()).configured)
  } catch {
    return false
  }
}

// Wider than the search box uses: a question like "what agentic work has she
// done" should pull passages from several repos, not four chunks of one.
const CHAT_K = 10

let retriever: Retriever | null = null

export async function retrieveChunkIds(query: string): Promise<{ ids: string[]; repos: string[] }> {
  if (!retriever) retriever = await Retriever.create()
  const hits = await retriever.search(query, CHAT_K)
  return {
    ids: hits.map((h) => h.id),
    repos: [...new Set(hits.map((h) => h.repo))],
  }
}

/**
 * Streams an answer, calling onDelta with each fragment as it arrives.
 * Throws with a human-readable message the UI can show as-is.
 */
export async function streamChat(
  messages: ChatMessage[],
  chunkIds: string[],
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, chunkIds }),
    signal,
  })

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}) as { error?: string })
    throw new Error(detail.error || 'Chat is unavailable right now.')
  }
  if (!res.body) throw new Error('Chat is unavailable right now.')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // Anthropic's SSE: events separated by a blank line, payload on `data:` lines.
  // Only content_block_delta carries text; the rest is bookkeeping we ignore.
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let cut: number
    while ((cut = buffer.indexOf('\n\n')) !== -1) {
      const event = buffer.slice(0, cut)
      buffer = buffer.slice(cut + 2)
      for (const line of event.split('\n')) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        if (!raw || raw === '[DONE]') continue
        try {
          const parsed = JSON.parse(raw)
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            onDelta(parsed.delta.text as string)
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error?.message || 'The model stopped unexpectedly.')
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') throw e
        }
      }
    }
  }
}
