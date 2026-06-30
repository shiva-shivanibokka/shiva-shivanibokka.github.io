import { DOMAINS } from '../data/projects'

export default function DomainsBand() {
  return (
    <section className="border-y border-white/10 bg-surface/40 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-sm uppercase tracking-widest text-muted">What I cover</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {DOMAINS.map((d) => (
            <span key={d} className="rounded-full border border-primary/30 px-4 py-1.5 text-sm text-text">{d}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
