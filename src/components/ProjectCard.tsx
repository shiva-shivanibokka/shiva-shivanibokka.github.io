import type { Project } from '../data/types'

export default function ProjectCard({ project }: { project: Project }) {
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
      <div className="mt-3.5 flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <span key={t} className="rounded border border-white/10 px-2.5 py-1 text-[12px] text-muted">
            {t}
          </span>
        ))}
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
