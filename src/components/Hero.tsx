import AskBox from './AskBox'
import Typewriter from './Typewriter'

const BUILDS = [
  'end-to-end production models',
  'agents',
  'deep-learning models',
  'RAG systems',
  'MLOps pipelines',
  'agentic workflows',
]

export default function Hero() {
  return (
    <section className="relative z-[2] flex min-h-[72vh] flex-col justify-center px-[clamp(28px,4vw,72px)] pb-6 pt-4">
      <div className="mb-4 flex flex-wrap items-center gap-2.5 text-[clamp(11px,1.05vw,14px)] font-medium uppercase tracking-[0.16em] text-text">
        <span className="h-[9px] w-[9px] rounded-full bg-mint shadow-[0_0_14px_#46E0D0]" />
        AI / ML Engineer <span className="text-primary">·</span> Agents{' '}
        <span className="text-primary">·</span> RAG <span className="text-primary">·</span> Deep Learning
      </div>

      <h1
        className="glitch-name max-w-full overflow-hidden whitespace-nowrap font-display text-[clamp(28px,6.6vw,112px)] leading-none tracking-[0.005em]"
        data-t="SHIVANI BOKKA"
      >
        SHIVANI BOKKA
      </h1>

      <div className="mt-6 max-w-full text-[clamp(15px,1.55vw,21px)] leading-relaxed text-[#E0DAE8] [text-shadow:0_1px_12px_rgba(0,0,0,0.7)]">
        <p className="flex flex-wrap items-baseline gap-x-2.5">
          <span>I build</span>
          <span className="font-bold text-mint">›</span>
          <Typewriter phrases={BUILDS} className="font-semibold text-white" />
        </p>
        <p className="mt-1.5">
          and this page runs <span className="text-mint">in-browser semantic search</span> over my work.
        </p>
      </div>

      <div className="mt-10">
        <AskBox />
      </div>
    </section>
  )
}
