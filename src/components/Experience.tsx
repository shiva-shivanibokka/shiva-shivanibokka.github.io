import { experience } from '../data/content'

export default function Experience() {
  return (
    <section id="experience" className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="text-3xl font-bold">Experience</h2>
      <div className="mt-8 space-y-8 border-l border-white/10 pl-6">
        {experience.map((e) => (
          <div key={`${e.role}-${e.period}`} className="relative">
            <span className="absolute -left-[1.7rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
            <p className="text-sm text-warm">{e.period}</p>
            <h3 className="mt-1 font-semibold text-text">{e.role}</h3>
            <p className="text-sm text-muted">{e.org}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
              {e.bullets.map((b) => <li key={b}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
