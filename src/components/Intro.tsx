import { useCallback, useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Cinematic intro: the "SB" monogram (Bungee Shade) is rendered, sampled into
// particles, zoomed in fast, then dispersed across the whole page in iridescent
// color — resolving into the hero. Plays once per session, is skippable, and is
// disabled entirely under prefers-reduced-motion. A safety timer always reveals
// the page even if requestAnimationFrame is throttled (e.g. backgrounded tab).
type P = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; hue: number; a: number }

const SEEN_KEY = 'introSeen'

export default function Intro() {
  const [active, setActive] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  // Decide on mount whether to play.
  useEffect(() => {
    if (reduced) {
      sessionStorage.setItem(SEEN_KEY, '1')
      return
    }
    if (!sessionStorage.getItem(SEEN_KEY)) {
      sessionStorage.setItem(SEEN_KEY, '1')
      setActive(true)
    }
  }, [reduced])

  // Animation lifecycle, runs whenever `active` flips true.
  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let safety = 0
    let endTimer = 0
    let particles: P[] = []
    let iw = 0
    let ih = 0
    let start = 0
    let disp = false
    let fading = false
    let finished = false

    const FADE_MS = 950

    // Begin a smooth, eased crossfade: drop the overlay's opacity (the page is
    // already mounted behind it, so the dispersing particles dissolve straight
    // into the hero) while the animation loop keeps running so the particles
    // stay alive during the fade. Unmount only after the fade fully completes.
    const beginFade = () => {
      if (fading) return
      fading = true
      window.clearTimeout(safety)
      overlay.style.pointerEvents = 'none'
      overlay.style.opacity = '0'
      endTimer = window.setTimeout(finish, FADE_MS)
    }

    const finish = () => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      window.clearTimeout(safety)
      window.clearTimeout(endTimer)
      setActive(false)
    }

    const build = () => {
      iw = canvas.width = window.innerWidth
      ih = canvas.height = window.innerHeight
      const off = document.createElement('canvas')
      off.width = iw
      off.height = ih
      const o = off.getContext('2d')!
      const fs = Math.min(iw * 0.3, ih * 0.52)
      o.fillStyle = '#fff'
      o.textAlign = 'center'
      o.textBaseline = 'middle'
      o.font = `900 ${fs}px "Bungee Shade", system-ui, sans-serif`
      o.fillText('SB', iw / 2, ih / 2)
      const d = o.getImageData(0, 0, iw, ih).data
      particles = []
      const gap = Math.max(2, Math.round(iw / 560))
      for (let y = 0; y < ih; y += gap) {
        for (let x = 0; x < iw; x += gap) {
          if (d[(y * iw + x) * 4 + 3] > 128) {
            particles.push({
              hx: x, hy: y,
              x: iw / 2 + (x - iw / 2) * 0.4,
              y: ih / 2 + (y - ih / 2) * 0.4,
              vx: 0, vy: 0,
              hue: (x / iw) * 200 + 180,
              a: 0,
            })
          }
        }
      }
    }

    const loop = () => {
      const t = (performance.now() - start) / 1000
      ctx.clearRect(0, 0, iw, ih)
      if (t < 0.7) {
        const z = 0.82 + 0.18 * (t / 0.7)
        for (const p of particles) {
          p.a = Math.min(1, p.a + 0.09)
          const tx = iw / 2 + (p.hx - iw / 2) * z
          const ty = ih / 2 + (p.hy - ih / 2) * z
          p.x += (tx - p.x) * 0.32
          p.y += (ty - p.y) * 0.32
        }
      } else if (t < 1.0) {
        for (const p of particles) {
          const tx = iw / 2 + (p.hx - iw / 2) + Math.sin(p.hy * 0.05 + t * 8) * 2.5
          const ty = ih / 2 + (p.hy - ih / 2)
          p.x += (tx - p.x) * 0.3
          p.y += (ty - p.y) * 0.3
        }
      } else if (t < 4.2) {
        if (!disp) {
          disp = true
          for (const p of particles) {
            const ang = Math.random() * Math.PI * 2
            const sp = 14 + Math.random() * 64
            p.vx = Math.cos(ang) * sp
            p.vy = Math.sin(ang) * sp
          }
        }
        for (const p of particles) {
          p.x += p.vx
          p.y += p.vy
          p.vx = p.vx * 0.985 + (Math.random() - 0.5) * 1.1
          p.vy = p.vy * 0.985 + (Math.random() - 0.5) * 1.1
          if (p.x < -20) p.x = iw + 20
          if (p.x > iw + 20) p.x = -20
          if (p.y < -20) p.y = ih + 20
          if (p.y > ih + 20) p.y = -20
          if (t > 2.0) p.a *= 0.975
        }
        // Start the crossfade while particles are still drifting so the intro
        // dissolves into the page instead of cutting to it.
        if (t > 2.6) beginFade()
      } else {
        finish()
        return
      }
      if (t > 1.0 && t < 1.32) {
        ctx.fillStyle = `rgba(210,225,255,${0.45 * (1 - (t - 1.0) / 0.32)})`
        ctx.fillRect(0, 0, iw, ih)
      }
      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, p.a)
        const col = `hsl(${(((p.hue + t * 70) % 360) + 360) % 360},92%,64%)`
        ctx.fillStyle = col
        ctx.shadowBlur = 11
        ctx.shadowColor = col
        ctx.fillRect(p.x, p.y, 3, 3)
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      raf = requestAnimationFrame(loop)
    }

    const go = () => {
      build()
      start = performance.now()
      disp = false
      finished = false
      overlay.style.pointerEvents = 'auto'
      overlay.style.opacity = '1'
      overlay.style.visibility = 'visible'
      loop()
      safety = window.setTimeout(beginFade, 6000)
    }

    // Wait for Bungee Shade before sampling glyph pixels (guarded for old/test envs).
    let cancelled = false
    const fontsReady = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve()
    fontsReady.then(() => {
      if (!cancelled) window.setTimeout(go, 80)
    })

    const onKey = () => beginFade()
    const onClick = () => beginFade()
    window.addEventListener('keydown', onKey)
    overlay.addEventListener('click', onClick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.clearTimeout(safety)
      window.clearTimeout(endTimer)
      window.removeEventListener('keydown', onKey)
      overlay.removeEventListener('click', onClick)
    }
  }, [active])

  const replay = useCallback(() => setActive(true), [])

  return (
    <>
      {active && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[100] bg-base transition-opacity duration-[850ms] ease-out [will-change:opacity]"
        >
          <canvas ref={canvasRef} className="block h-full w-full" />
          <span className="pointer-events-none fixed bottom-6 right-7 text-xs text-muted">
            click / press any key to skip
          </span>
        </div>
      )}
      {!active && !reduced && (
        <button
          onClick={replay}
          className="fixed bottom-5 right-5 z-40 rounded-lg border border-mint/40 bg-mint/10 px-3 py-2 text-xs font-bold text-mint transition hover:bg-mint/20"
          aria-label="Replay intro animation"
        >
          ↺ replay intro
        </button>
      )}
    </>
  )
}
