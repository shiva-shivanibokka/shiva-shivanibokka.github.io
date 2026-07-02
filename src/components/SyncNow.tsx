import { useRef, useState } from 'react'
import { dispatchSync, getToken, hasToken, latestRun, setToken } from '../lib/github'

// Floating "Sync from GitHub" control. Kicks off the deploy workflow (which
// re-scans your repos + READMEs and redeploys), watches it, and reloads when it
// finishes (~1–2 min). First use asks for a fine-grained token (Actions: r/w),
// stored only in this browser.
type State = 'idle' | 'starting' | 'running' | 'done' | 'error'

export default function SyncNow() {
  const [open, setOpen] = useState(false)
  const [tok, setTok] = useState(getToken())
  const [state, setState] = useState<State>('idle')
  const [msg, setMsg] = useState('')
  const tries = useRef(0)

  const poll = (beforeId: number | null) => {
    tries.current += 1
    latestRun().then((run) => {
      if (run && run.id !== beforeId && run.status === 'completed') {
        setState('done')
        setTimeout(() => window.location.reload(), 900)
        return
      }
      if (tries.current > 30) {
        setMsg('taking a while — refresh soon')
        setState('idle')
        return
      }
      window.setTimeout(() => poll(beforeId), 8000)
    })
  }

  const run = async () => {
    if (!hasToken()) {
      setOpen(true)
      setMsg('paste a token to enable syncing')
      return
    }
    setState('starting')
    setMsg('')
    const before = await latestRun()
    const res = await dispatchSync()
    if (!res.ok) {
      setState('error')
      setMsg(res.message)
      return
    }
    setState('running')
    tries.current = 0
    window.setTimeout(() => poll(before?.id ?? null), 6000)
  }

  const busy = state === 'starting' || state === 'running' || state === 'done'
  const label = state === 'starting' ? 'Starting…' : state === 'running' ? 'Syncing…' : state === 'done' ? 'Reloading' : '⟳ Sync from GitHub'

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[300px] rounded-xl border border-white/15 bg-black/80 p-3 text-left backdrop-blur-md">
          <p className="mb-2 text-[11.5px] leading-relaxed text-muted">
            Paste a fine-grained GitHub token (Actions: read &amp; write on <span className="text-text">shiva-shivanibokka.github.io</span>). Stored only in this browser.
          </p>
          <input
            type="password"
            value={tok}
            onChange={(e) => setTok(e.target.value)}
            placeholder="github_pat_…"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-[12px] text-text outline-none focus:border-mint/60"
          />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => { setToken(tok); setMsg(tok ? 'saved' : 'cleared'); if (tok) setOpen(false) }} className="rounded-lg border border-mint/50 bg-mint/15 px-3 py-1 text-[12px] font-bold text-mint">Save</button>
            <button onClick={() => { setToken(''); setTok(''); setMsg('cleared') }} className="rounded-lg border border-white/15 px-3 py-1 text-[12px] font-bold text-muted">Clear</button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        {msg && <span className="rounded-md bg-black/70 px-2 py-1 font-mono text-[11px] text-muted backdrop-blur-md">{msg}</span>}
        <button
          onClick={run}
          disabled={busy}
          title="Re-scan my GitHub repos & READMEs and redeploy"
          className={`rounded-full border px-4 py-2.5 text-[13px] font-bold shadow-lg backdrop-blur-md transition ${
            busy ? 'border-mint/40 bg-mint/10 text-mint/70' : 'border-mint/50 bg-mint/15 text-mint hover:-translate-y-0.5'
          }`}
        >
          {busy && <span className="mr-1.5 inline-block animate-spin">⟳</span>}
          {label}
        </button>
        <button onClick={() => setOpen((o) => !o)} title="Token settings" className="rounded-full border border-white/15 bg-black/60 px-2.5 py-2.5 text-[13px] text-muted backdrop-blur-md hover:text-text">⚙</button>
      </div>
    </div>
  )
}
