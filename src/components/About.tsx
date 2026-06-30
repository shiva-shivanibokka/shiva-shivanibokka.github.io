import { bio, links } from '../data/content'

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h2 className="text-3xl font-bold">About & Contact</h2>
      <p className="mt-6 text-muted">{bio}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.url}
            target={l.url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="rounded-xl border border-primary/40 px-5 py-2 text-text hover:border-warm hover:text-warm"
          >
            {l.label}
          </a>
        ))}
      </div>
    </section>
  )
}
