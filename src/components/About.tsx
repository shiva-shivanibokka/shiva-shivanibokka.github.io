import { bio, links } from '../data/content'

export default function About() {
  return (
    <section id="about" className="w-full px-[clamp(28px,4vw,72px)] py-12">
      <p className="text-base uppercase tracking-[0.2em] text-mint">// 04</p>
      <h2 className="mt-2 text-[clamp(32px,4.5vw,60px)] font-bold tracking-tight">About &amp; Contact</h2>

      <div className="mt-6 w-full rounded-2xl border border-white/10 bg-surface/60 p-8 backdrop-blur-sm">
        <p className="text-[22px] leading-relaxed text-muted">{bio}</p>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target={l.url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="rounded-xl border border-primary/40 bg-white/[0.02] px-6 py-3 text-[16px] font-medium text-text transition hover:-translate-y-0.5 hover:border-mint hover:text-mint"
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </section>
  )
}
