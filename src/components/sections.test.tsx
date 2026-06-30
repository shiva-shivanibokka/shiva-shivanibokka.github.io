import { render, screen } from '@testing-library/react'
import Experience from './Experience'
import Skills from './Skills'
import About from './About'

test('experience renders roles with periods', () => {
  render(<Experience />)
  expect(screen.getAllByText(/Teaching Assistant/i).length).toBeGreaterThan(0)
})

test('skills renders grouped skills', () => {
  render(<Skills />)
  expect(screen.getByText(/Languages/i)).toBeInTheDocument()
})

test('about renders bio and an email link', () => {
  render(<About />)
  expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute('href', expect.stringContaining('mailto:'))
})
