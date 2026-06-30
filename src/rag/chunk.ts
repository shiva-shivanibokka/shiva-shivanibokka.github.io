export function chunkText(
  text: string,
  opts: { maxChars?: number; overlap?: number } = {},
): string[] {
  const maxChars = opts.maxChars ?? 1200
  const overlap = opts.overlap ?? 150

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0)

  // 1) Normalize into "units" that are each <= maxChars by hard-splitting any
  //    oversized paragraph up front. Keeps the packing loop deterministic.
  const units: string[] = []
  for (const p of paragraphs) {
    if (p.length <= maxChars) {
      units.push(p)
    } else {
      for (let i = 0; i < p.length; i += maxChars) units.push(p.slice(i, i + maxChars))
    }
  }

  // 2) Pack units into chunks <= maxChars, prepending `overlap` trailing chars
  //    of the previous chunk to each new chunk for retrieval context.
  const chunks: string[] = []
  let current = ''
  for (const u of units) {
    const candidate = current ? current + ' ' + u : u
    if (current && candidate.length > maxChars) {
      chunks.push(current)
      const tail = overlap > 0 ? current.slice(-overlap) : ''
      current = tail ? tail + ' ' + u : u
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)

  return chunks.filter((c) => c.length > 0)
}
