import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRetriever } from '../hooks/useRetriever'
import type { Answer } from '../rag/answer'

const CHIPS = ['agentic systems', 'RAG vs CAG', 'deep learning from scratch', 'MLOps', 'healthcare ML']

type State = 'idle' | 'thinking' | 'done' | 'error'

export default function AskBox({ ask: askProp }: { ask?: (q: string) => Promise<Answer> }) {
  const hook = useRetriever()
  const ask = askProp ?? hook.ask
  const [query, setQuery] = useState('')
  const [state, setState] = useState<State>('idle')
  const [answer, setAnswer] = useState<Answer | null>(null)

  async function run(q: string) {
    if (!q.trim()) return
    setState('thinking')
    setAnswer(null)
    try {
      const a = await ask(q)
      setAnswer(a)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); run(query) }}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-surface p-2 shadow-xl"
      >
        <input
          type="search"
          aria-label="Ask anything about my work"
          placeholder="Ask anything about my work…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent px-3 py-3 text-text placeholder:text-muted focus:outline-none"
        />
        <button type="submit" className="rounded-xl bg-primary px-4 py-3 font-medium text-base hover:opacity-90">
          Ask
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c}
            onClick={() => { setQuery(c); run(c) }}
            className="rounded-full border border-white/10 px-3 py-1 text-sm text-muted hover:border-warm hover:text-warm"
          >
            {c}
          </button>
        ))}
      </div>

      {state === 'thinking' && (
        <motion.p
          className="mt-4 flex items-center gap-2 text-warm"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
        >
          <span className="h-2 w-2 rounded-full bg-warm" /> thinking — retrieving from my repos…
        </motion.p>
      )}

      {state === 'done' && answer && (
        answer.empty ? (
          <p className="mt-4 text-muted">
            I didn't find a strong match — try a broader term, or browse{' '}
            <a href="#projects" className="text-primary underline">projects</a>.
          </p>
        ) : (
          <div className="mt-4 rounded-xl border border-white/10 bg-surface p-4">
            <p className="whitespace-pre-line text-text">{answer.body}</p>
            {answer.sources.length > 0 && (
              <div className="mt-3 border-t border-white/10 pt-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted">Sources</p>
                <ul className="flex flex-wrap gap-2">
                  {answer.sources.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} aria-label={s.title} target="_blank" rel="noreferrer" className="text-sm text-primary hover:text-warm underline">
                        {s.repo}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      )}

      {state === 'error' && (
        <p className="mt-4 text-muted">
          Something went wrong loading the model. Browse{' '}
          <a href="#projects" className="text-primary underline">projects</a> instead.
        </p>
      )}
    </div>
  )
}
