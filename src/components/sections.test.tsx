import { render, screen } from '@testing-library/react'
import DomainsBand from './DomainsBand'
import Experience from './Experience'
import Skills from './Skills'
import About from './About'

test('domains band lists every domain', () => {
  render(<DomainsBand />)
  expect(screen.getByText('Agentic')).toBeInTheDocument()
  expect(screen.getByText('MLOps')).toBeInTheDocument()
})

test('experience renders roles with periods', () => {
  render(<Experience />)
  expect(screen.getByText(/Teaching Assistant/i)).toBeInTheDocument()
})

test('skills renders grouped skills', () => {
  render(<Skills />)
  expect(screen.getByText(/Languages/i)).toBeInTheDocument()
})

test('about renders bio and an email link', () => {
  render(<About />)
  expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute('href', expect.stringContaining('mailto:'))
})
