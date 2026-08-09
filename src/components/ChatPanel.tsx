import { useEffect, useRef, useState } from 'react'
import { retrieveChunkIds, streamChat, type ChatMessage } from '../lib/chat'

const STARTERS = [
  'What AI projects has she built?',
  'Tell me about the autonomous SWE agent',
  'What has she done with RAG?',
  'Does she have production MLOps experience?',
]

// Just enough markdown for what the model is asked to emit: links, bold, inline
// code, `-` bullets, paragraphs. A parser library would be several times the
// weight of the whole chat feature for no visible gain.
function renderInline(text: string, keyBase: string) {
  const nodes: React.ReactNode[] = []
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|(https?:\/\/[^\s)]+)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const key = `${keyBase}-${i++}`
    if (m[1]) {
      nodes.push(
        <a key={key} href={m[2]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 hover:text-warm">
          {m[1]}
        </a>,
      )
    } else if (m[3]) {
      nodes.push(<strong key={key} className="font-semibold text-text">{m[3]}</strong>)
    } else if (m[4]) {
      nodes.push(<code key={key} className="rounded bg-white/10 px-1 py-0.5 text-[13px]">{m[4]}</code>)
    } else if (m[5]) {
      nodes.push(
        <a key={key} href={m[5]} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2 hover:text-warm">
          {m[5].replace(/^https?:\/\//, '')}
        </a>,
      )
    }
    last = pattern.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = []
  const lines = text.split('\n')
  let bullets: string[] = []

  const flush = (key: string) => {
    if (!bullets.length) return
    blocks.push(
      <ul key={key} className="my-2 space-y-1.5 pl-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-mint" />
            <span>{renderInline(b, `${key}-${i}`)}</span>
          </li>
        ))}
      </ul>,
    )
    bullets = []
  }

  lines.forEach((line, i) => {
    const t = line.trim()
    if (/^[-*]\s+/.test(t)) {
      bullets.push(t.replace(/^[-*]\s+/, ''))
      return
    }
    flush(`ul-${i}`)
    if (!t) return
    if (/^#{1,6}\s/.test(t)) {
      blocks.push(
        <p key={i} className="mt-3 text-[13px] font-semibold uppercase tracking-wide text-mint">
          {renderInline(t.replace(/^#{1,6}\s+/, ''), `h-${i}`)}
        </p>,
      )
      return
    }
    blocks.push(
      <p key={i} className="my-2 leading-relaxed">
        {renderInline(t, `p-${i}`)}
      </p>,
    )
  })
  flush('ul-end')
  return <div className="text-[14.5px] text-[#D4CDE0]">{blocks}</div>
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming])

  useEffect(() => () => abortRef.current?.abort(), [])

  async function send(question: string) {
    const q = question.trim()
    if (!q || streaming) return

    setError(null)
    setDraft('')
    const history: ChatMessage[] = [...messages, { role: 'user', content: q }]
    setMessages(history)
    setStreaming(true)

    const ctl = new AbortController()
    abortRef.current = ctl

    try {
      setStage('searching her repos…')
      const { ids, repos } = await retrieveChunkIds(q)
      // Light up the matching nodes on the embedding-map background, the same
      // way the search box does.
      window.dispatchEvent(new CustomEvent('rag-retrieve', { detail: { repos } }))

      setStage('reading the READMEs…')
      setMessages([...history, { role: 'assistant', content: '' }])

      let acc = ''
      await streamChat(
        history,
        ids,
        (delta) => {
          acc += delta
          setMessages([...history, { role: 'assistant', content: acc }])
        },
        ctl.signal,
      )
      if (!acc.trim()) throw new Error('No answer came back. Try asking again.')
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setError((e as Error).message || 'Something went wrong.')
      setMessages(history) // drop the empty assistant bubble
    } finally {
      setStreaming(false)
      setStage('')
      abortRef.current = null
    }
  }

  const empty = messages.length === 0

  return (
    <div className="flex flex-col">
      <div ref={scrollRef} className="max-h-[46vh] min-h-[120px] overflow-y-auto px-5 py-4">
        {empty && (
          <>
            <p className="mb-3.5 text-[13.5px] text-muted">
              ↳ ask about her projects and I&apos;ll answer from the READMEs — so you don&apos;t have to open GitHub:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-white/[0.16] bg-white/[0.03] px-4 py-2 text-left text-[13.5px] text-[#D4CDE0] transition hover:border-mint hover:text-mint"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="space-y-4">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm border border-mint/30 bg-mint/[0.08] px-4 py-2.5 text-[14.5px] text-text">
                  {m.content}
                </p>
              </div>
            ) : (
              <div key={i} className="border-l-2 border-primary/40 pl-4">
                {m.content ? (
                  <Markdown text={m.content} />
                ) : (
                  <p className="text-[13.5px] text-mint">
                    <span className="text-muted">→</span> {stage || 'thinking…'}
                    <span className="ml-1 inline-block animate-pulse">▍</span>
                  </p>
                )}
              </div>
            ),
          )}
        </div>

        {error && (
          <p className="mt-3 text-[13.5px] text-warm">
            {error}{' '}
            <a href="mailto:shivani.bokka93@gmail.com" className="underline">
              Email her instead
            </a>
            .
          </p>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(draft)
        }}
        className="flex items-center gap-3 border-t border-white/[0.08] px-5 py-4"
      >
        <span className="text-[20px] font-bold text-mint">&gt;</span>
        <input
          aria-label="Ask about her work"
          placeholder={empty ? 'ask about her work…' : 'ask a follow-up…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={streaming}
          maxLength={600}
          className="min-w-0 flex-1 bg-transparent text-[clamp(15px,1.4vw,18px)] text-text placeholder:text-muted focus:outline-none disabled:opacity-50"
        />
        {messages.length > 0 && !streaming && (
          <button
            type="button"
            onClick={() => {
              setMessages([])
              setError(null)
            }}
            className="shrink-0 rounded-[10px] border border-white/20 px-3.5 py-2.5 text-[12.5px] font-bold text-muted transition hover:border-warm hover:text-warm"
          >
            ✕ clear
          </button>
        )}
        <button
          type={streaming ? 'button' : 'submit'}
          onClick={streaming ? () => abortRef.current?.abort() : undefined}
          className="shrink-0 rounded-[10px] border border-mint bg-mint/10 px-4 py-2.5 text-[13px] font-bold text-mint transition hover:bg-mint/20"
        >
          {streaming ? 'STOP' : 'ASK ⌘↵'}
        </button>
      </form>
    </div>
  )
}
