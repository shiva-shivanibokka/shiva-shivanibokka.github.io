import { skillGroups } from '../data/content'

const ACCENTS = ['text-primary', 'text-mint', 'text-warm']

export default function Skills() {
  return (
    <section id="skills" className="w-full px-[clamp(28px,4vw,72px)] py-12">
      <p className="text-base uppercase tracking-[0.2em] text-mint">// 03</p>
      <h2 className="mt-2 text-[clamp(26px,3.4vw,44px)] font-bold tracking-tight">Skills</h2>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skillGroups.map((g, i) => (
          <div
            key={g.label}
            className="rounded-2xl border border-white/10 bg-surface/60 p-5 backdrop-blur-sm transition hover:border-primary/40"
          >
            <h3 className={`text-[16px] font-bold ${ACCENTS[i % ACCENTS.length]}`}>
              <span className="text-muted">{String(i + 1).padStart(2, '0')}</span> {g.label}
            </h3>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {g.items.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1 text-[13.5px] text-muted"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
