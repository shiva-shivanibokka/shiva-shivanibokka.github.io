import { Retriever } from '../rag/retriever'
import { projects } from '../data/projects'

// Talking to the chat Worker. The retrieval half stays here in the browser —
// the embedding model and index are already loaded for the search box — so all
// that crosses the wire is the conversation, the ids of the chunks that
// matched, and which project the thread has settled on.

export const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT ?? 'https://portfolio-chat.shivani-bokka93.workers.dev/chat'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Wider than the search box uses: "what agentic work has she done" should pull
// passages from several repos, not four chunks of one.
const CHAT_K = 10

let retriever: Retriever | null = null

/**
 * Is the chat backend deployed AND holding a key? The tab stays hidden unless
 * this is true, so the site never offers a feature that will error.
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

// A follow-up rarely repeats the subject: after "tell me about the SWE agent",
// the next question is "how does it handle retries?", which on its own embeds
// to nothing useful. Retrieval therefore runs against the question *plus* the
// previous one.
function retrievalQuery(history: ChatMessage[], question: string): string {
  const prevUser = [...history].reverse().find((m) => m.role === 'user')
  return prevUser ? `${prevUser.content}\n${question}` : question
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/**
 * Which project is the conversation about? Named projects win — someone who
 * types "tell me about the SWE agent" has said which one. Otherwise, if the
 * retrieved passages concentrate on a single repo, that is the subject. A
 * previous focus carries forward, so "and how is it tested?" stays on topic.
 */
export function detectFocus(question: string, history: ChatMessage[], hitRepos: string[], previous: string | null): string | null {
  const q = norm(question)
  const named = projects.find((p) => q.includes(norm(p.title)) || q.includes(norm(p.repo)))
  if (named) return named.repo

  // A short question with no project in it is almost always a follow-up.
  const anaphoric = question.trim().split(/\s+/).length <= 12 && /\b(it|its|that|this|they|the project)\b/i.test(question)
  if (anaphoric && previous) return previous

  const top = hitRepos[0]
  if (top && hitRepos.filter((r) => r === top).length >= 2) return top
  if (history.length === 0) return null
  return previous
}

export async function retrieveContext(
  question: string,
  history: ChatMessage[],
  previousFocus: string | null,
): Promise<{ ids: string[]; repos: string[]; focusRepo: string | null }> {
  if (!retriever) retriever = await Retriever.create()
  const hits = await retriever.search(retrievalQuery(history, question), CHAT_K)
  const hitRepos = hits.map((h) => h.repo)
  const focusRepo = detectFocus(question, history, hitRepos, previousFocus)
  return {
    ids: hits.map((h) => h.id),
    repos: [...new Set(focusRepo ? [focusRepo, ...hitRepos] : hitRepos)],
    focusRepo,
  }
}

/**
 * Streams an answer, calling onDelta with each fragment. The Worker normalises
 * every provider to `data: {"t":"..."}`, so this parser never changes when the
 * model behind it does.
 */
export async function streamChat(
  messages: ChatMessage[],
  chunkIds: string[],
  focusRepo: string | null,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, chunkIds, focusRepo }),
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
        const parsed = JSON.parse(raw)
        if (parsed.error) throw new Error(parsed.error)
        if (typeof parsed.t === 'string') onDelta(parsed.t)
      }
    }
  }
}
