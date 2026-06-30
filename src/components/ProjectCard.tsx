import type { Project } from '../data/types'

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="flex flex-col rounded-xl border border-white/10 bg-surface p-5 transition hover:border-primary/60">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{project.domain}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-text">{project.title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{project.blurb}</p>
      {project.metrics && project.metrics.length > 0 && (
        <p className="mt-3 text-xs font-mono text-warm">{project.metrics.join(' · ')}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tech.map((t) => (
          <span key={t} className="rounded border border-white/10 px-2 py-0.5 text-xs text-muted">{t}</span>
        ))}
      </div>
      <a href={project.url} target="_blank" rel="noreferrer" className="mt-4 text-sm text-primary hover:text-warm">
        View repo →
      </a>
    </article>
  )
}
