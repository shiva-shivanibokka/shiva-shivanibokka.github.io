import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Lush ambient neural-network backdrop (decorative). The *real* labeled embedding
// map lives in the <LatentSpace /> section. Honors prefers-reduced-motion.
type P = { x: number; y: number; vx: number; vy: number; r: number; c: string }
const COLORS = ['139,123,255', '255,138,107', '70,224,208']

export default function EmbeddingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let pts: P[] = []
    let w = 0
    let h = 0
    let raf = 0

    const seed = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      const n = Math.min(140, Math.floor(w / 12))
      pts = Array.from({ length: n }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32,
        vy: (Math.random() - 0.5) * 0.32,
        r: Math.random() * 1.8 + 0.9,
        c: COLORS[i % COLORS.length],
      }))
    }

    const paint = (move: boolean) => {
      ctx.clearRect(0, 0, w, h)
      const dist = Math.min(w, h) * 0.17
      for (const p of pts) {
        if (move) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > w) p.vx *= -1
          if (p.y < 0 || p.y > h) p.vy *= -1
        }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i]
          const b = pts[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < dist) {
            ctx.strokeStyle = `rgba(${a.c},${0.42 * (1 - d / dist)})`
            ctx.lineWidth = 1.1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `rgb(${p.c})`
        ctx.shadowBlur = 12
        ctx.shadowColor = `rgb(${p.c})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
    }

    const loop = () => {
      paint(true)
      raf = requestAnimationFrame(loop)
    }

    seed()
    if (reduced) paint(false)
    else loop()

    const onResize = () => {
      seed()
      if (reduced) paint(false)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [reduced])

  return (
    <>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0" />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(11,10,18,0.10), rgba(11,10,18,0.02) 40%, rgba(11,10,18,0.16)), radial-gradient(1000px 640px at 16% 40%, rgba(11,10,18,0.45), transparent 60%)',
        }}
      />
    </>
  )
}
