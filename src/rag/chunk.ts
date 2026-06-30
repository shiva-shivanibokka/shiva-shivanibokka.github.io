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

  const chunks: string[] = []
  let current = ''
  for (const para of paragraphs) {
    if (current && current.length + para.length + 1 > maxChars) {
      chunks.push(current.trim())
      const tail = overlap > 0 ? current.slice(-overlap) : ''
      current = tail ? tail + ' ' + para : para
    } else {
      current = current ? current + ' ' + para : para
    }
    // Hard-split a single oversized paragraph.
    while (current.length > maxChars) {
      chunks.push(current.slice(0, maxChars).trim())
      current = (overlap > 0 ? current.slice(maxChars - overlap, maxChars) : '') + current.slice(maxChars)
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.filter((c) => c.length > 0)
}
