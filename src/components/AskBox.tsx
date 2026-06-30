import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRetriever } from '../hooks/useRetriever'
import { projects } from '../data/projects'
import type { Answer } from '../rag/answer'

const REPO_COUNT = new Set(projects.map((p) => p.repo)).size

const CHIPS = ['agentic systems', 'RAG projects', 'deep learning', 'MLOps', 'healthcare ML', 'computer vision']

const TRACE = [
  'embedding your query…',
  'searching 384-dim latent space…',
  'ranking repos by cosine similarity…',
  'surfacing the best matches…',
]

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

  function clear() {
    setState('idle')
    setQuery('')
    setAnswer(null)
  }

  return (
    <div className="w-full overflow-hidden rounded-[18px] border border-white/15 bg-[linear-gradient(180deg,rgba(22,20,31,0.92),rgba(16,14,24,0.92))] shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-md">
      {/* terminal chrome */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.08] px-5 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 text-[12.5px] text-muted">ask-my-work — zsh</span>
      </div>

      {/* prompt row */}
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          run(query)
        }}
        className="flex items-center gap-3 px-5 py-5"
      >
        <span className="text-[20px] font-bold text-mint">&gt;</span>
        <input
          type="search"
          aria-label="Search my work by meaning"
          placeholder="search my work by meaning…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[clamp(15px,1.4vw,18px)] text-text placeholder:text-muted focus:outline-none"
        />
        {state !== 'idle' && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-[10px] border border-white/20 px-3.5 py-2.5 text-[12.5px] font-bold text-muted transition hover:border-warm hover:text-warm"
          >
            ✕ clear
          </button>
        )}
        <button
          type="submit"
          className="shrink-0 rounded-[10px] border border-mint bg-mint/10 px-4 py-2.5 text-[13px] font-bold text-mint transition hover:bg-mint/20"
        >
          RUN ⌘↵
        </button>
      </form>

      {/* idle: example questions */}
      {state === 'idle' && (
        <>
          <p className="px-5 pb-2.5 text-[13.5px] text-muted">
            ↳ semantic search over my repos — finds the most relevant projects by meaning, with match scores:
          </p>
          <div className="flex flex-wrap gap-2.5 px-5 pb-5">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setQuery(c)
                  run(c)
                }}
                className="rounded-full border border-white/[0.16] bg-white/[0.03] px-4 py-2 text-[13.5px] text-[#D4CDE0] transition hover:border-mint hover:text-mint"
              >
                {c}
              </button>
            ))}
          </div>
        </>
      )}

      {/* thinking: live retrieval trace */}
      {state === 'thinking' && (
        <div className="space-y-2 px-5 py-5 text-[13.5px]">
          {TRACE.map((s, i) => (
            <motion.p
              key={s}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.28 }}
              className="text-mint"
            >
              <span className="text-muted">→</span> {s}
            </motion.p>
          ))}
        </div>
      )}

      {/* done */}
      {state === 'done' &&
        answer &&
        (answer.empty ? (
          <p className="px-5 py-5 text-[13.5px] text-muted">
            I didn&apos;t find a strong match — try a broader term, or browse{' '}
            <a href="#projects" className="text-primary underline">
              projects
            </a>
            .
          </p>
        ) : answer.groups && answer.groups.length > 0 ? (
          <div className="px-5 py-5">
            <p className="mb-3.5 text-[12px] uppercase tracking-[0.15em] text-muted">
              ↳ most relevant projects · ranked by similarity
            </p>
            <div className="space-y-5">
            {answer.groups.map((g) => (
              <div key={g.url || g.title} className="border-l-2 border-primary/40 pl-4">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <a
                    href={g.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14.5px] font-bold uppercase tracking-wide text-primary hover:text-warm"
                  >
                    {g.title} ↗
                  </a>
                  <span className="text-[12.5px] text-mint">· {g.score.toFixed(2)} match</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-[#D4CDE0]">
                  {g.text}
                </p>
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="px-5 py-5">
            <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-text">{answer.body}</p>
            {answer.sources.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <p className="mb-1.5 text-[12px] uppercase tracking-wide text-muted">Sources</p>
                <ul className="flex flex-wrap gap-3">
                  {answer.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[14px] text-primary underline hover:text-warm"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

      {/* error */}
      {state === 'error' && (
        <p className="px-5 py-5 text-[13.5px] text-muted">
          Something went wrong loading the model. Browse{' '}
          <a href="#projects" className="text-primary underline">
            projects
          </a>{' '}
          instead.
        </p>
      )}

      {/* status footer */}
      <div className="flex flex-wrap items-center gap-2.5 border-t border-white/[0.08] px-5 py-3 text-[12.5px] text-mint">
        <span className="h-2 w-2 rounded-full bg-mint shadow-[0_0_12px_#46E0D0]" />
        model ready <span className="text-muted">·</span> all-MiniLM-L6-v2{' '}
        <span className="text-muted">·</span> 384-dim <span className="text-muted">·</span> {REPO_COUNT}{' '}
        repos embedded
      </div>
    </div>
  )
}
