import { experience } from '../data/content'

export default function Experience() {
  return (
    <section id="experience" className="w-full px-[clamp(28px,4vw,72px)] py-12">
      <p className="text-base uppercase tracking-[0.2em] text-mint">// 03</p>
      <h2 className="mt-2 text-[clamp(23px,2.9vw,38px)] font-bold tracking-tight">Experience</h2>

      <div className="mt-10 space-y-4">
        {experience.map((e) => (
          <div
            key={`${e.role}-${e.period}`}
            className="rounded-2xl border border-white/10 border-l-2 border-l-mint/50 bg-surface/60 p-6 backdrop-blur-sm transition hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px]">
              <span className="text-warm">{e.period}</span>
              <span className="rounded-full border border-white/15 px-3 py-0.5 text-[12px] text-muted">{e.kind}</span>
            </div>
            <h3 className="mt-2 text-[clamp(16px,1.5vw,21px)] font-bold text-text">{e.role}</h3>
            <p className="text-[14px] text-primary">{e.org}</p>
            <p className="text-[12.5px] text-muted">{e.location}</p>
            <ul className="mt-3.5 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-muted marker:text-primary">
              {e.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
