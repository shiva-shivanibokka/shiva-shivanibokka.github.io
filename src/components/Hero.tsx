import AskBox from './AskBox'
import NeuralBackdrop from './NeuralBackdrop'

export default function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <NeuralBackdrop />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Shivani Bokka</h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          AI/ML Engineer — I build agents, RAG systems, and deep-learning models.
          <span className="text-text"> This page runs a real RAG over my own work.</span>
        </p>
        <div className="mt-8 flex w-full justify-center">
          <AskBox />
        </div>
        <a href="#projects" className="mt-10 text-sm text-muted hover:text-warm">↓ explore projects</a>
      </div>
    </section>
  )
}
