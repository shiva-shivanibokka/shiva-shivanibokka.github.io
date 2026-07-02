import { useState } from 'react'
import type { Project } from '../data/types'
import { CAT_COLOR, groupTech } from '../lib/techCategories'

// Collapsed cards are uniform height (clamped title + description), so the grid
// stays even. One "Show more" toggle reveals the full description and the tech
// stack; expanding one card only grows that card (grid uses items-start).
export default function ProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)
  const groups = groupTech(project.tech)

  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-surface/60 p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-primary/60">
      <span className="w-max rounded-full bg-primary/15 px-3 py-1 text-[12.5px] font-medium text-primary">
        {project.domain}
      </span>
      <h3 className="mt-3.5 line-clamp-2 min-h-[2.9rem] text-[18px] font-bold leading-snug text-text">{project.title}</h3>

      <p className={`mt-2.5 text-[14.5px] leading-relaxed text-muted ${open ? '' : 'line-clamp-3 min-h-[4.4rem]'}`}>
        {project.blurb}
      </p>

      {open && project.metrics && project.metrics.length > 0 && (
        <p className="mt-2.5 text-[13px] text-warm">▸ {project.metrics.join(' · ')}</p>
      )}

      {/* Expanded: tech grouped into colored, headed rows (heading | values) */}
      {open && groups.length > 0 && (
        <div className="mt-3.5 flex flex-col gap-2">
          {groups.map(([cat, items]) => {
            const c = CAT_COLOR[cat]
            return (
              <div key={cat} className="flex gap-3">
                <span className="w-[86px] shrink-0 pt-1 text-[11px] font-semibold text-muted">{cat}</span>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border px-2 py-0.5 text-[11.5px] font-medium"
                      style={{ color: c, borderColor: `${c}55`, background: `${c}14` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-[13.5px] font-semibold text-mint transition hover:text-warm"
          aria-expanded={open}
        >
          {open ? '▾ Show less' : '▸ Show more'}
        </button>
        <a
          href={project.url}
          target="_blank"
          rel="noreferrer"
          className="text-[13.5px] font-medium text-mint transition hover:text-warm"
        >
          View repo →
        </a>
      </div>
    </article>
  )
}
