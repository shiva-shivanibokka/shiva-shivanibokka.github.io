import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AskBox from './AskBox'
import type { Answer } from '../rag/answer'

test('shows answer and sources after asking', async () => {
  const fakeAsk = async (_q: string): Promise<Answer> => ({
    body: 'I built CAG vs RAG Showdown.',
    sources: [{ title: 'CAG vs RAG Showdown', url: 'https://github.com/shiva-shivanibokka/CAG-vs-RAG-Showdown', repo: 'CAG-vs-RAG-Showdown' }],
    empty: false,
  })
  render(<AskBox ask={fakeAsk} />)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'best rag project' } })
  fireEvent.submit(screen.getByRole('search'))
  await waitFor(() => expect(screen.getByText(/CAG vs RAG Showdown/)).toBeInTheDocument())
  expect(screen.getByRole('link', { name: /CAG vs RAG Showdown/i })).toHaveAttribute('href', expect.stringContaining('CAG-vs-RAG-Showdown'))
})

test('shows empty state when no match', async () => {
  const fakeAsk = async (): Promise<Answer> => ({ body: '', sources: [], empty: true })
  render(<AskBox ask={fakeAsk} />)
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyz' } })
  fireEvent.submit(screen.getByRole('search'))
  await waitFor(() => expect(screen.getByText(/didn't find a strong match/i)).toBeInTheDocument())
})
