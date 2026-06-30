import { experience } from '../data/content'

export default function Experience() {
  return (
    <section id="experience" className="w-full px-[clamp(28px,4vw,72px)] py-12">
      <p className="text-base uppercase tracking-[0.2em] text-mint">// 02</p>
      <h2 className="mt-2 text-[clamp(32px,4.5vw,60px)] font-bold tracking-tight">Experience</h2>

      <div className="mt-10 space-y-5">
        {experience.map((e) => (
          <div
            key={`${e.role}-${e.period}`}
            className="rounded-2xl border border-white/10 border-l-2 border-l-mint/50 bg-surface/60 p-7 backdrop-blur-sm transition hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[16px]">
              <span className="text-warm">{e.period}</span>
              <span className="rounded-full border border-white/15 px-3 py-0.5 text-[14px] text-muted">{e.kind}</span>
            </div>
            <h3 className="mt-2 text-[clamp(19px,1.8vw,26px)] font-bold text-text">{e.role}</h3>
            <p className="text-[16.5px] text-primary">{e.org}</p>
            <p className="text-[15px] text-muted">{e.location}</p>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[19.5px] leading-relaxed text-muted marker:text-primary">
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
