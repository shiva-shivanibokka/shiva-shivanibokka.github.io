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
      return buildAnswer(results)
    } catch (e) {
      setStatus('error')
      throw e
    }
  }, [])

  return { ask, status }
}
