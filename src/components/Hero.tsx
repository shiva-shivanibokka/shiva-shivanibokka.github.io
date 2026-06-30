import AskBox from './AskBox'

export default function Hero() {
  return (
    <section className="relative z-[2] flex min-h-[78vh] flex-col justify-center px-[clamp(28px,4vw,72px)] pb-6 pt-4">
      <div className="mb-5 flex flex-wrap items-center gap-3 text-[clamp(15px,1.5vw,20px)] font-medium uppercase tracking-[0.16em] text-text">
        <span className="h-[11px] w-[11px] rounded-full bg-mint shadow-[0_0_18px_#46E0D0]" />
        AI / ML Engineer <span className="text-primary">·</span> Agents{' '}
        <span className="text-primary">·</span> RAG <span className="text-primary">·</span> Deep Learning
      </div>

      <h1
        className="glitch-name max-w-full overflow-hidden whitespace-nowrap font-display text-[clamp(34px,8.8vw,150px)] leading-none tracking-[0.005em]"
        data-t="SHIVANI BOKKA"
      >
        SHIVANI BOKKA
      </h1>

      <p className="mt-5 max-w-full overflow-hidden whitespace-nowrap text-[clamp(12px,1.72vw,24px)] leading-relaxed text-[#E0DAE8] [text-shadow:0_1px_12px_rgba(0,0,0,0.7)]">
        I build <b className="text-white">agents</b>, <span className="text-primary">RAG systems</span> &amp;{' '}
        <span className="text-warm">deep-learning models</span> — and this page runs{' '}
        <span className="text-mint">real in-browser semantic search</span> over my work.
      </p>

      <div className="mt-16">
        <AskBox />
      </div>
    </section>
  )
}
