// Lets the site kick off its own deploy workflow (which re-scans your GitHub
// repos + READMEs and redeploys) using a fine-grained token stored ONLY in this
// browser. Token needs Actions: read & write on shiva-shivanibokka.github.io.

const OWNER = 'shiva-shivanibokka'
const REPO = 'shiva-shivanibokka.github.io'
const TOKEN_KEY = 'portfolio-gh-token'
const API = 'https://api.github.com'

export const getToken = (): string => {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}
export const setToken = (t: string) => {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}
export const hasToken = (): boolean => !!getToken()

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function dispatchSync(): Promise<{ ok: boolean; message: string }> {
  const token = getToken()
  if (!token) return { ok: false, message: 'Paste a token first' }
  const r = await fetch(`${API}/repos/${OWNER}/${REPO}/actions/workflows/deploy.yml/dispatches`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ ref: 'main' }),
  })
  if (r.status === 204) return { ok: true, message: 'Sync started' }
  // Surface GitHub's actual reason instead of guessing.
  let detail = ''
  try {
    const j = await r.json()
    detail = j?.message || ''
  } catch {
    /* no body */
  }
  if (r.status === 401) return { ok: false, message: 'Invalid or expired token' }
  if (r.status === 403 || r.status === 404)
    return { ok: false, message: `${r.status}: ${detail || 'token can’t access this repo — check it selects shiva-shivanibokka.github.io + Actions: read & write'}` }
  return { ok: false, message: `GitHub ${r.status}${detail ? `: ${detail}` : ''}` }
}

export async function latestRun(): Promise<{ id: number; status: string } | null> {
  const token = getToken()
  if (!token) return null
  const r = await fetch(`${API}/repos/${OWNER}/${REPO}/actions/runs?per_page=1`, { headers: authHeaders(token) })
  if (!r.ok) return null
  const j = await r.json()
  const run = j.workflow_runs?.[0]
  return run ? { id: run.id, status: run.status } : null
}
