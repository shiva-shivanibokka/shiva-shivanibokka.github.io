import { useState } from 'react'
import { projects, DOMAINS } from '../data/projects'
import type { Domain } from '../data/types'
import ProjectCard from './ProjectCard'

type Filter = Domain | 'All'

type RoleKey = 'ML Engineer' | 'Data Scientist' | 'Deep Learning' | 'GenAI / Agentic' | 'SWE / Full-Stack'
const ROLES: Record<RoleKey, { domains: Domain[]; line: string }> = {
  'ML Engineer': {
    domains: ['ML System Design', 'MLOps', 'Deep Learning', 'Classical ML'],
    line: 'Production ML systems — training, serving, drift, and the ops to keep them alive.',
  },
  'Data Scientist': {
    domains: ['Data Science', 'Classical ML', 'Deep Learning', 'NLP'],
    line: 'From messy data to models and insight — analysis, modeling, and clear results.',
  },
  'Deep Learning': {
    domains: ['Deep Learning', 'NLP'],
    line: 'Neural nets from scratch to Transformers — CNNs, attention, LSTMs, and sequence models.',
  },
  'GenAI / Agentic': {
    domains: ['Agentic', 'LLMs & GenAI', 'NLP'],
    line: 'LLM agents, RAG/CAG architectures, and applied generative AI.',
  },
  'SWE / Full-Stack': {
    domains: ['Full-Stack / Product', 'Agentic', 'MLOps'],
    line: 'Shipping real products end-to-end — APIs, frontends, and infra.',
  },
}
const ROLE_KEYS = Object.keys(ROLES) as RoleKey[]

export default function ProjectGrid() {
  const [filter, setFilter] = useState<Filter>('All')
  const [role, setRole] = useState<RoleKey | null>(null)

  const visible = role
    ? projects.filter((p) => ROLES[role].domains.includes(p.domain))
    : filter === 'All'
      ? projects
      : projects.filter((p) => p.domain === filter)

  const filters: Filter[] = ['All', ...DOMAINS]

  return (
    <section id="projects" className="w-full px-[clamp(28px,4vw,72px)] py-12">
      <p className="text-base uppercase tracking-[0.2em] text-mint">// 01</p>
      <h2 className="mt-2 text-[clamp(32px,4.5vw,60px)] font-bold tracking-tight">Projects</h2>
      <p className="mt-3 text-[17px] text-muted">{projects.length} things I&apos;ve built.</p>

      {/* Hiring-for role lens */}
      <div className="mt-7 rounded-2xl border border-white/10 bg-surface/60 p-6 backdrop-blur-sm">
        <h3 className="mb-4 text-[22px] font-bold text-text">
          <span className="text-mint">▸</span> Hiring for a specific role?
        </h3>
        <div className="flex flex-wrap gap-3">
          {ROLE_KEYS.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole((cur) => (cur === r ? null : r))
                setFilter('All')
              }}
              className={`rounded-xl px-5 py-3 text-[17px] font-semibold transition ${
                role === r
                  ? 'bg-primary text-[#0B0A12]'
                  : 'border border-primary/40 text-text hover:border-mint hover:text-mint'
              }`}
            >
              {r}
            </button>
          ))}
          {role && (
            <button
              onClick={() => setRole(null)}
              className="rounded-xl border border-white/15 px-5 py-3 text-[17px] text-muted transition hover:border-warm hover:text-warm"
            >
              ✕ clear
            </button>
          )}
        </div>
        {role && <p className="mt-4 text-[18px] text-warm">{ROLES[role].line}</p>}
      </div>

      {/* domain filters (disabled visual when a role lens is active) */}
      {!role && (
        <div className="mt-6 flex flex-wrap gap-2.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-5 py-3 text-[17px] transition ${
                filter === f
                  ? 'bg-primary font-semibold text-[#0B0A12]'
                  : 'border border-white/15 text-muted hover:border-mint hover:text-mint'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </section>
  )
}
