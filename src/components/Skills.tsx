import { skillGroups } from '../data/content'

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-bold">Skills</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((g) => (
          <div key={g.label} className="rounded-xl border border-white/10 bg-surface p-5">
            <h3 className="font-semibold text-primary">{g.label}</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {g.items.map((s) => (
                <span key={s} className="rounded border border-white/10 px-2 py-0.5 text-xs text-muted">{s}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
