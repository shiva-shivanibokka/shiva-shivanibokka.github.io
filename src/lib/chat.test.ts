import { describe, expect, it } from 'vitest'
import { detectFocus } from './chat'
import { projects } from '../data/projects'

// Follow-up handling is the whole point of focus tracking, so it gets the test:
// a narrow question after a project has been named must stay on that project,
// or the reader silently gets answers about the wrong repo.
describe('detectFocus', () => {
  const sample = projects[0]

  it('locks on when a project is named', () => {
    expect(detectFocus(`tell me about ${sample.title}`, [], ['some-other-repo'], null)).toBe(sample.repo)
  })

  it('keeps the subject through an anaphoric follow-up', () => {
    const history = [
      { role: 'user' as const, content: `tell me about ${sample.title}` },
      { role: 'assistant' as const, content: 'It does things.' },
    ]
    expect(detectFocus('how does it handle retries?', history, ['unrelated-repo'], sample.repo)).toBe(sample.repo)
  })

  it('follows the retrieved passages when they agree and nothing is named', () => {
    expect(detectFocus('what about the training loop', [], ['repo-a', 'repo-a', 'repo-b'], null)).toBe('repo-a')
  })

  it('stays unfocused on a broad opening question', () => {
    expect(detectFocus('what AI projects has she built?', [], ['repo-a', 'repo-b', 'repo-c'], null)).toBeNull()
  })
})
