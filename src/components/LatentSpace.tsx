import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// The "let the embeddings shine" section: a real, interactive 2D map of every
// repo in embedding space (built at build time → public/embedding-map.json).
// Similar repos cluster; hover shows the repo; click opens it; and when the
// search above retrieves, the matching nodes pulse and connect right here.

type MapNode = { repo: string; title: string; domain: string; x: number; y: number }
type Live = MapNode & { c: string; phase: number; hx: number; hy: number; cx: number; cy: number }

const DOMAIN_COLORS: Record<string, string> = {
  Agentic: '139,123,255',
  'LLMs & GenAI': '255,138,107',
  'Deep Learning': '70,224,208',
  'ML System Design': '120,150,255',
  MLOps: '255,184,92',
  'Classical ML': '255,120,180',
  'Data Science': '120,220,150',
  NLP: '186,140,255',
  'Full-Stack / Product': '90,200,255',
}
const colorFor = (d: string) => DOMAIN_COLORS[d] ?? '139,123,255'
const ghUrl = (repo: string) => `https://github.com/shiva-shivanibokka/${repo}`
const LEGEND = Object.entries(DOMAIN_COLORS)

export default function LatentSpace() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let nodes: Live[] = []
    let raw: MapNode[] = []
    let w = 0
    let h = 0
    let raf = 0
    let t0 = 0
    const mouse = { x: -1, y: -1 }
    let hoverRepo: string | null = null
    const hot = new Map<string, number>()

    const layout = () => {
      const rect = wrap.getBoundingClientRect()
      w = canvas.width = Math.max(1, rect.width)
      h = canvas.height = Math.max(1, rect.height)
      const padX = w * 0.07
      const padY = h * 0.12
      nodes = raw.map((n, i) => {
        const hx = padX + n.x * (w - padX * 2)
        const hy = padY + n.y * (h - padY * 2)
        return { ...n, c: colorFor(n.domain), phase: i * 1.7, hx, hy, cx: hx, cy: hy }
      })
    }

    const draw = (time: number) => {
      if (!t0) t0 = time
      const t = (time - t0) / 1000
      ctx.clearRect(0, 0, w, h)

      for (const n of nodes) {
        if (reduced) {
          n.cx = n.hx
          n.cy = n.hy
        } else {
          n.cx = n.hx + Math.sin(t * 0.45 + n.phase) * 7
          n.cy = n.hy + Math.cos(t * 0.4 + n.phase * 1.3) * 7
        }
      }

      // cluster links
      const linkDist = Math.min(w, h) * 0.22
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const d = Math.hypot(a.cx - b.cx, a.cy - b.cy)
          if (d < linkDist) {
            ctx.strokeStyle = `rgba(${a.c},${0.32 * (1 - d / linkDist)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.cx, a.cy)
            ctx.lineTo(b.cx, b.cy)
            ctx.stroke()
          }
        }
      }

      // bright links between retrieved nodes
      const hotNodes = nodes.filter((n) => (hot.get(n.repo) ?? 0) > 0.05)
      for (let i = 0; i < hotNodes.length; i++) {
        for (let j = i + 1; j < hotNodes.length; j++) {
          const s = Math.min(hot.get(hotNodes[i].repo) ?? 0, hot.get(hotNodes[j].repo) ?? 0)
          ctx.strokeStyle = `rgba(255,255,255,${0.5 * s})`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(hotNodes[i].cx, hotNodes[i].cy)
          ctx.lineTo(hotNodes[j].cx, hotNodes[j].cy)
          ctx.stroke()
        }
      }

      // nodes
      hoverRepo = null
      for (const n of nodes) {
        const heat = hot.get(n.repo) ?? 0
        const near = mouse.x >= 0 && Math.hypot(n.cx - mouse.x, n.cy - mouse.y) < 18
        if (near) hoverRepo = n.repo
        const r = 5.5 + heat * 8 + (near ? 3 : 0)
        ctx.fillStyle = heat > 0.05 ? 'rgb(255,255,255)' : `rgb(${n.c})`
        ctx.shadowBlur = 14 + heat * 24
        ctx.shadowColor = `rgb(${n.c})`
        ctx.beginPath()
        ctx.arc(n.cx, n.cy, r, 0, Math.PI * 2)
        ctx.fill()
        if (heat > 0.05) {
          ctx.shadowBlur = 0
          ctx.strokeStyle = `rgba(255,255,255,${heat})`
          ctx.lineWidth = 1.8
          ctx.beginPath()
          ctx.arc(n.cx, n.cy, r + 5 + (1 - heat) * 16, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.shadowBlur = 0

      // labels for hovered + retrieved nodes
      ctx.font = '600 13px "JetBrains Mono", monospace'
      for (const n of nodes) {
        const heat = hot.get(n.repo) ?? 0
        const isHover = n.repo === hoverRepo
        if (!isHover && heat < 0.05) continue
        const label = n.title
        const tw = ctx.measureText(label).width
        let lx = n.cx + 12
        if (lx + tw + 12 > w) lx = n.cx - tw - 20
        const ly = n.cy - 12
        ctx.fillStyle = 'rgba(11,10,18,0.88)'
        ctx.fillRect(lx - 7, ly - 15, tw + 14, 24)
        ctx.strokeStyle = `rgba(${n.c},0.8)`
        ctx.lineWidth = 1
        ctx.strokeRect(lx - 7, ly - 15, tw + 14, 24)
        ctx.fillStyle = '#ECE6DD'
        ctx.fillText(label, lx, ly + 2)
      }

      canvas.style.cursor = hoverRepo ? 'pointer' : 'default'

      for (const [k, v] of hot) {
        const nv = v - 0.0013
        if (nv <= 0) hot.delete(k)
        else hot.set(k, nv)
      }

      raf = requestAnimationFrame(draw)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }
    const onLeave = () => {
      mouse.x = -1
      mouse.y = -1
    }
    const onClick = () => {
      if (hoverRepo) window.open(ghUrl(hoverRepo), '_blank', 'noopener')
    }
    const onResize = () => layout()
    const onRetrieve = (e: Event) => {
      const repos: string[] = (e as CustomEvent).detail?.repos ?? []
      repos.forEach((r) => hot.set(r, 1))
    }

    fetch(`${import.meta.env.BASE_URL}embedding-map.json`)
      .then((r) => r.json())
      .then((data: MapNode[]) => {
        raw = data
        layout()
        canvas.addEventListener('mousemove', onMove)
        canvas.addEventListener('mouseleave', onLeave)
        canvas.addEventListener('click', onClick)
        window.addEventListener('resize', onResize)
        window.addEventListener('rag-retrieve', onRetrieve)
        raf = requestAnimationFrame(draw)
      })
      .catch(() => {})

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', onLeave)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('rag-retrieve', onRetrieve)
    }
  }, [reduced])

  return (
    <section className="w-full px-[clamp(28px,4vw,72px)] pb-12 pt-24">
      <p className="text-base uppercase tracking-[0.2em] text-mint">// my repos, mapped in embedding space</p>
      <h2 className="mt-2 text-[clamp(23px,2.9vw,38px)] font-bold tracking-tight">Connecting the Dots</h2>
      <p className="mt-4 w-full text-[15.5px] leading-relaxed text-muted">
        Every repo is embedded into a <span className="text-text">384-dim vector</span> and projected to 2D —
        work that&apos;s similar in meaning sits close together, so my projects form clusters. Hover a node to
        see the repo, click to open it, or <span className="text-mint">run a search above</span> and watch the
        matches light up.
      </p>

      <div
        ref={wrapRef}
        className="relative mt-8 h-[clamp(460px,68vh,720px)] w-full overflow-hidden rounded-2xl border border-primary/25 bg-surface/40 backdrop-blur-sm"
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <span className="pointer-events-none absolute bottom-3 left-4 text-[12.5px] text-muted">
          hover a node · click to open the repo
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2.5">
        {LEGEND.map(([d, c]) => (
          <span key={d} className="flex items-center gap-2 text-[13.5px] text-muted">
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: `rgb(${c})`, boxShadow: `0 0 9px rgb(${c})` }}
            />
            {d}
          </span>
        ))}
      </div>
    </section>
  )
}
