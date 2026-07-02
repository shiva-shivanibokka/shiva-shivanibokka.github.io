import EmbeddingBackground from './components/EmbeddingBackground'
import Intro from './components/Intro'
import Nav from './components/Nav'
import Hero from './components/Hero'
import LatentSpace from './components/LatentSpace'
import ProjectGrid from './components/ProjectGrid'
import Experience from './components/Experience'
import Skills from './components/Skills'
import About from './components/About'
import SyncNow from './components/SyncNow'

export default function App() {
  return (
    <div className="relative min-h-screen bg-base text-text">
      <EmbeddingBackground />
      <SyncNow />
      <Intro />
      <div className="relative z-[2]">
        <Nav />
        <main>
          <Hero />
          <LatentSpace />
          <ProjectGrid />
          <Skills />
          <Experience />
          <About />
        </main>
        <footer className="border-t border-white/10 px-[clamp(28px,4vw,72px)] py-10 text-sm text-muted">
          <span className="text-mint">$</span> built by Shivani Bokka — this page runs a real in-browser RAG over my own repos.
        </footer>
      </div>
    </div>
  )
}
