import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the hero name and all major sections', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /Shivani Bokka/i, level: 1 })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /^Projects$/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /^Experience$/ })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /^Skills$/ })).toBeInTheDocument()
  expect(screen.getByRole('navigation')).toBeInTheDocument()
})
