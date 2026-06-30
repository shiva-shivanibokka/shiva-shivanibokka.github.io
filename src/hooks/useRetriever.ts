import { useCallback, useRef, useState } from 'react'
import { Retriever } from '../rag/retriever'
import { buildAnswer, type Answer } from '../rag/answer'

type Status = 'idle' | 'loading' | 'ready' | 'error'

export function useRetriever() {
  const [status, setStatus] = useState<Status>('idle')
  const retrieverRef = useRef<Retriever | null>(null)

  const ask = useCallback(async (query: string): Promise<Answer> => {
    try {
      if (!retrieverRef.current) {
        setStatus('loading')
        retrieverRef.current = await Retriever.create()
      }
      setStatus('loading')
      const results = await retrieverRef.current.search(query, 4)
      setStatus('ready')
      // Light up the matching repo-nodes on the embedding-map background.
      const answer = buildAnswer(results)
      if (typeof window !== 'undefined') {
        const repos = (answer.groups ?? []).map((g) => g.repo).filter(Boolean)
        window.dispatchEvent(new CustomEvent('rag-retrieve', { detail: { repos } }))
      }
      return answer
    } catch (e) {
      setStatus('error')
      throw e
    }
  }, [])

  return { ask, status }
}
