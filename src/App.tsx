import Nav from './components/Nav'
import Hero from './components/Hero'
import DomainsBand from './components/DomainsBand'
import ProjectGrid from './components/ProjectGrid'
import Experience from './components/Experience'
import Skills from './components/Skills'
import About from './components/About'

export default function App() {
  return (
    <div className="min-h-screen bg-base text-text">
      <Nav />
      <main>
        <Hero />
        <DomainsBand />
        <ProjectGrid />
        <Experience />
        <Skills />
        <About />
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        Built by Shivani Bokka — this page runs a real in-browser RAG over my repos.
      </footer>
    </div>
  )
}
