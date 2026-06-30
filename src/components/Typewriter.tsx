import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Rotating typewriter: types a phrase, holds, deletes it, then moves to the
// next — looping forever. Reduced-motion users see a calm, static phrase.
export default function Typewriter({
  phrases,
  className = '',
}: {
  phrases: string[]
  className?: string
}) {
  const reduced = usePrefersReducedMotion()
  const [i, setI] = useState(0) // which phrase
  const [n, setN] = useState(0) // how many chars shown
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reduced) return
    const full = phrases[i % phrases.length]

    // pause at the end of a fully-typed phrase before deleting
    if (!deleting && n === full.length) {
      const hold = setTimeout(() => setDeleting(true), 1400)
      return () => clearTimeout(hold)
    }
    // finished deleting → advance to the next phrase
    if (deleting && n === 0) {
      const gap = setTimeout(() => {
        setDeleting(false)
        setI((v) => (v + 1) % phrases.length)
      }, 350)
      return () => clearTimeout(gap)
    }

    const step = setTimeout(
      () => setN((v) => v + (deleting ? -1 : 1)),
      deleting ? 45 : 80,
    )
    return () => clearTimeout(step)
  }, [n, deleting, i, phrases, reduced])

  const shown = reduced ? phrases[0] : phrases[i % phrases.length].slice(0, n)

  return (
    <span className={className}>
      {shown}
      <span className="cursor-blink text-mint" aria-hidden>
        ▌
      </span>
    </span>
  )
}
