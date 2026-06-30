import { render, screen, fireEvent } from '@testing-library/react'
import ProjectGrid from './ProjectGrid'
import { projects } from '../data/projects'

test('renders all projects by default and filters by domain', () => {
  render(<ProjectGrid />)
  expect(screen.getAllByRole('article')).toHaveLength(projects.length)
  fireEvent.click(screen.getByRole('button', { name: 'Agentic' }))
  const agentic = projects.filter((p) => p.domain === 'Agentic').length
  expect(screen.getAllByRole('article')).toHaveLength(agentic)
})
