import { useState } from 'react'
import { projects, DOMAINS } from '../data/projects'
import type { Domain } from '../data/types'
import ProjectCard from './ProjectCard'

type Filter = Domain | 'All'

export default function ProjectGrid() {
  const [filter, setFilter] = useState<Filter>('All')
  const visible = filter === 'All' ? projects : projects.filter((p) => p.domain === filter)
  const filters: Filter[] = ['All', ...DOMAINS]

  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 py-20">
      <h2 className="text-3xl font-bold">Projects</h2>
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm transition ${
              filter === f ? 'bg-primary text-base' : 'border border-white/10 text-muted hover:text-warm'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </section>
  )
}
