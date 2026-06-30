import { bio, links } from '../data/content'

export default function About() {
  return (
    <section id="about" className="w-full px-[clamp(28px,4vw,72px)] py-12">
      <p className="text-base uppercase tracking-[0.2em] text-mint">// 04</p>
      <h2 className="mt-2 text-[clamp(23px,2.9vw,38px)] font-bold tracking-tight">About &amp; Contact</h2>

      <div className="mt-6 w-full rounded-2xl border border-white/10 bg-surface/60 p-7 backdrop-blur-sm">
        <p className="text-[16.5px] leading-relaxed text-muted">{bio}</p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3.5">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target={l.url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="rounded-xl border border-primary/40 bg-white/[0.02] px-5 py-2.5 text-[14px] font-medium text-text transition hover:-translate-y-0.5 hover:border-mint hover:text-mint"
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </section>
  )
}
