import SyncNow from './SyncNow'

const ITEMS = [
  { n: '01', label: 'Projects', href: '#projects' },
  { n: '02', label: 'Skills', href: '#skills' },
  { n: '03', label: 'Experience', href: '#experience' },
  { n: '04', label: 'About', href: '#about' },
  { n: '05', label: 'Résumé', href: `${import.meta.env.BASE_URL}resume.pdf` },
]

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-base/50 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 px-[clamp(28px,4vw,72px)] py-4">
        <a href="#" className="text-[19px] font-bold tracking-tight">
          shivani<span className="text-primary">.ai</span>
        </a>
        <div className="flex flex-wrap items-center gap-2.5">
          {ITEMS.map((i) => (
            <a
              key={i.href}
              href={i.href}
              {...(i.label === 'Résumé' ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="flex items-center gap-2 rounded-xl border border-primary/40 bg-[rgba(13,12,20,0.6)] px-4 py-2.5 text-[13.5px] font-bold text-text shadow-[0_0_16px_-3px_rgba(139,123,255,0.5),inset_0_0_0_1px_rgba(139,123,255,0.08)] backdrop-blur transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_22px_-2px_rgba(139,123,255,0.75)]"
            >
              <span className="text-[11px] font-medium text-muted">{i.n}</span> {i.label}
            </a>
          ))}
          <SyncNow />
        </div>
      </div>
    </nav>
  )
}
