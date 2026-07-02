import type { Project } from '../data/types'
import { CAT_COLOR, groupTech } from '../lib/techCategories'

export default function ProjectCard({ project }: { project: Project }) {
  const groups = groupTech(project.tech)
  return (
    <article className="flex flex-col rounded-2xl border border-white/10 bg-surface/60 p-5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-primary/60">
      <span className="w-max rounded-full bg-primary/15 px-3 py-1 text-[12.5px] font-medium text-primary">
        {project.domain}
      </span>
      <h3 className="mt-3.5 text-[18px] font-bold leading-snug text-text">{project.title}</h3>
      <p className="mt-2.5 flex-1 text-[14.5px] leading-relaxed text-muted">{project.blurb}</p>
      {project.metrics && project.metrics.length > 0 && (
        <p className="mt-2.5 text-[13px] text-warm">▸ {project.metrics.join(' · ')}</p>
      )}
      <div className="mt-3.5 flex flex-col gap-2">
        {groups.map(([cat, items]) => {
          const c = CAT_COLOR[cat]
          return (
            <div key={cat}>
              <div className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: c }}>
                {cat}
              </div>
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
      <a
        href={project.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 text-[13.5px] font-medium text-mint transition hover:text-warm"
      >
        View repo →
      </a>
    </article>
  )
}
