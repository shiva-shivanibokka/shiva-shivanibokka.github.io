import { render, screen } from '@testing-library/react'
import App from './App'

test('renders a main landmark with the name heading', () => {
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /Shivani Bokka/i })).toBeInTheDocument()
})
