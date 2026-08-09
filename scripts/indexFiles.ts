import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { SearchIndex } from '../src/rag/indexTypes'

// The index is written as two files rather than one.
//
// JSON stores every float as ASCII digits: "0.043821156" is eleven bytes to
// carry four bytes of information. Across 266,880 floats that turned a 1.02 MB
// payload into 6.13 MB, all of which a visitor downloads before search or chat
// will answer. Splitting the vectors into a raw Float32Array buffer and leaving
// the human-readable parts in JSON removes the tax without giving up
// inspectability of the metadata.
//
// META  — chunk ids, repo, title, url, text  (readable, diffable, small)
// VEC   — little-endian float32, chunks × dim, row-major (the vectors)

export const META_FILE = 'search-meta.json'
export const VEC_FILE = 'search-vectors.bin'

export type IndexMeta = Omit<SearchIndex, 'chunks'> & {
  chunks: Omit<SearchIndex['chunks'][number], 'embedding'>[]
}

export async function writeIndex(outDir: string, index: SearchIndex): Promise<{ metaBytes: number; vecBytes: number }> {
  const dim = index.dim
  const flat = new Float32Array(index.chunks.length * dim)
  index.chunks.forEach((c, i) => flat.set(c.embedding, i * dim))

  const meta: IndexMeta = {
    ...index,
    chunks: index.chunks.map(({ embedding: _embedding, ...rest }) => rest),
  }

  const metaJson = JSON.stringify(meta)
  await fs.writeFile(path.join(outDir, META_FILE), metaJson)
  await fs.writeFile(path.join(outDir, VEC_FILE), Buffer.from(flat.buffer))
  return { metaBytes: Buffer.byteLength(metaJson), vecBytes: flat.byteLength }
}

/** Rejoin the two files into the shape the rest of the code already expects. */
export async function readIndex(publicDir: string): Promise<SearchIndex> {
  const meta: IndexMeta = JSON.parse(await fs.readFile(path.join(publicDir, META_FILE), 'utf-8'))
  const buf = await fs.readFile(path.join(publicDir, VEC_FILE))
  const flat = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4)
  const dim = meta.dim
  return {
    ...meta,
    chunks: meta.chunks.map((c, i) => ({ ...c, embedding: Array.from(flat.subarray(i * dim, (i + 1) * dim)) })),
  }
}
