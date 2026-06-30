import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

// Decorative animated SVG node-graph behind the hero. CSS-only animation so it
// stays cheap; disabled entirely when the user prefers reduced motion.
export default function NeuralBackdrop() {
  const reduced = usePrefersReducedMotion()
  const nodes = [
    [12, 20], [28, 60], [48, 30], [68, 70], [82, 40], [60, 18], [36, 84],
  ]
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
      {nodes.map((a, i) =>
        nodes.slice(i + 1).map((b, j) => (
          <line key={`${i}-${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#7C6CF0" strokeWidth={0.15} strokeOpacity={0.4} />
        )),
      )}
      {nodes.map((n, i) => (
        <circle key={i} cx={n[0]} cy={n[1]} r={0.9} fill={i % 3 === 0 ? '#FF8A6B' : '#7C6CF0'}>
          {!reduced && (
            <animate attributeName="r" values="0.9;1.6;0.9" dur={`${3 + (i % 3)}s`} repeatCount="indefinite" />
          )}
        </circle>
      ))}
    </svg>
  )
}
