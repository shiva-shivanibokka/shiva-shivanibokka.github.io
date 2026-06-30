export interface IndexChunk {
  id: string
  repo: string
  domain: string
  title: string
  url: string
  text: string
  embedding: number[]
}

export interface SearchIndex {
  model: string
  dim: number
  chunks: IndexChunk[]
}

export const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2'
export const EMBED_DIM = 384
