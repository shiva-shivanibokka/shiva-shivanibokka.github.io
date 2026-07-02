import { useRef, useState } from 'react'
import { dispatchSync, getToken, hasToken, latestRun, setToken } from '../lib/github'

// Header "Sync from GitHub" control (button + ⚙ token settings). Kicks off the
// deploy workflow (re-scans repos + READMEs and redeploys), watches it, and
// reloads when it finishes (~1–2 min). Token stored only in this browser.
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
  const label = state === 'starting' ? 'Starting…' : state === 'running' ? 'Syncing…' : state === 'done' ? 'Reloading' : 'Sync'

  const navBtn =
    'flex items-center gap-2 rounded-xl border border-primary/40 bg-[rgba(13,12,20,0.6)] px-4 py-2.5 text-[13.5px] font-bold text-text shadow-[0_0_16px_-3px_rgba(139,123,255,0.5),inset_0_0_0_1px_rgba(139,123,255,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10'

  return (
    <div className="relative flex items-center gap-2">
      {msg && <span className="hidden font-mono text-[11px] text-muted sm:inline">{msg}</span>}
      <button onClick={run} disabled={busy} title="Re-scan my GitHub repos & READMEs and redeploy" className={navBtn}>
        <span className={busy ? 'inline-block animate-spin' : ''}>⟳</span> {busy ? label : 'Sync from GitHub'}
      </button>
      <button onClick={() => setOpen((o) => !o)} title="Token settings" className={navBtn} aria-label="Sync settings">
        ⚙
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[300px] rounded-xl border border-white/15 bg-base/95 p-3 text-left shadow-xl backdrop-blur-md">
          <p className="mb-2 text-[11.5px] leading-relaxed text-muted">
            Paste a fine-grained GitHub token (Actions: read &amp; write on <span className="text-text">shiva-shivanibokka.github.io</span>). Stored only in this browser.
          </p>
          <input
            type="password"
            value={tok}
            onChange={(e) => setTok(e.target.value)}
            placeholder="github_pat_…"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 font-mono text-[12px] text-text outline-none focus:border-primary/60"
          />
          <div className="mt-2 flex items-center gap-2">
            <button onClick={() => { setToken(tok); setMsg(tok ? 'saved' : 'cleared'); if (tok) setOpen(false) }} className="rounded-lg border border-primary/50 bg-primary/15 px-3 py-1 text-[12px] font-bold text-text">Save</button>
            <button onClick={() => { setToken(''); setTok(''); setMsg('cleared') }} className="rounded-lg border border-white/15 px-3 py-1 text-[12px] font-bold text-muted">Clear</button>
            {msg && <span className="font-mono text-[11px] text-muted">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
