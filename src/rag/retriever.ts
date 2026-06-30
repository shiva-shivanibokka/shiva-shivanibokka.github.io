import { EMBED_MODEL, type IndexChunk, type SearchIndex } from './indexTypes'

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export type ScoredChunk = IndexChunk & { score: number }

export function topK(index: SearchIndex, queryEmbedding: number[], k = 4): ScoredChunk[] {
  return index.chunks
    .map((c) => ({ ...c, score: cosineSim(c.embedding, queryEmbedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
}

export class Retriever {
  private constructor(
    private index: SearchIndex,
    private embed: (q: string) => Promise<number[]>,
  ) {}

  static async create(indexUrl = `${import.meta.env.BASE_URL}search-index.json`): Promise<Retriever> {
    const index: SearchIndex = await fetch(indexUrl).then((r) => r.json())
    const { pipeline, env } = await import('@xenova/transformers')
    // Load the embedding model from our OWN origin (vendored in public/models/),
    // not an external CDN — faster, dependency-free, and reliable on GitHub Pages.
    env.allowLocalModels = true
    env.allowRemoteModels = false
    env.localModelPath = `${import.meta.env.BASE_URL}models/`
    env.useBrowserCache = true
    const extractor = await pipeline('feature-extraction', EMBED_MODEL)
    const embed = async (q: string) => {
      const res = await extractor(q, { pooling: 'mean', normalize: true })
      return Array.from(res.data as Float32Array)
    }
    return new Retriever(index, embed)
  }

  async search(query: string, k = 4): Promise<ScoredChunk[]> {
    const q = await this.embed(query)
    return topK(this.index, q, k)
  }
}
