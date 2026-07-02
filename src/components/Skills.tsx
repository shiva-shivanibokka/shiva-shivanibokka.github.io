import { skillGroups } from '../data/content'

export default function Skills() {
  return (
    <section id="skills" className="w-full px-[clamp(28px,4vw,72px)] py-12">
      <p className="text-base uppercase tracking-[0.2em] text-mint">// 02</p>
      <h2 className="mt-2 text-[clamp(23px,2.9vw,38px)] font-bold tracking-tight">Skills</h2>
      <p className="mt-3 text-[14px] text-muted">Pulled together from the tech across the projects on this page.</p>

      <div className="mt-10 grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {skillGroups.map((g, i) => (
          <div
            key={g.label}
            className="rounded-2xl border bg-surface/60 p-5 backdrop-blur-sm transition"
            style={{ borderColor: `${g.color}33` }}
          >
            <h3 className="text-[16px] font-bold" style={{ color: g.color }}>
              <span className="text-muted">{String(i + 1).padStart(2, '0')}</span> {g.label}
            </h3>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {g.items.map((s) => (
                <span
                  key={s}
                  className="rounded-md border px-2.5 py-1 text-[12.5px] font-medium"
                  style={{ color: g.color, borderColor: `${g.color}55`, background: `${g.color}14` }}
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
