const ITEMS = [
  { label: 'Projects', href: '#projects' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'About', href: '#about' },
]

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-base/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <a href="#" className="font-semibold tracking-tight">shivani<span className="text-primary">.ai</span></a>
        <div className="flex gap-5 text-sm text-muted">
          {ITEMS.map((i) => (
            <a key={i.href} href={i.href} className="hover:text-warm">{i.label}</a>
          ))}
        </div>
      </div>
    </nav>
  )
}
