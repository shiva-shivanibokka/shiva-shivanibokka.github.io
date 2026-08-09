// Shared markdown/HTML stripping used by both build scripts:
//   - build-index.ts  → stripMarkdown()  (clean prose for the RAG corpus)
//   - build-projects.ts → proseLength() / firstParagraph()  (README triage)
// These were previously re-implemented in each script with overlapping regex
// pipelines. They are centralised here VERBATIM so behaviour is byte-for-byte
// identical to the originals (the >=500-char prose threshold and first-paragraph
// blurb extraction must not change which repos get included on the site).

// Strip markdown/HTML noise so retrieved chunks read as clean prose, not raw README source.
export function stripMarkdown(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, ' ')              // HTML comments
    .replace(/```[\s\S]*?```/g, ' ')               // fenced code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')         // images / badges
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')       // links -> link text
    .replace(/^\s*\[[^\]]+\]:\s*\S+.*$/gm, ' ')    // reference link defs
    .replace(/<[^>]+>/g, ' ')                       // HTML tags
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, ' ')  // table separator rows
    // Table rows, turned into readable sentences rather than run-on words.
    // Replacing pipes with spaces merged every cell of every row into one
    // stream — "Agent Model Responsibility Orchestrator Haiku/Sonnet Intent
    // classification" — which is unreadable in a result and near-useless as
    // model context. Cells are joined with an em dash and the row is ended with
    // a full stop, so rows stay distinct once whitespace is collapsed.
    .replace(/^[ \t]*\|(.+)\|[ \t]*$/gm, (_line, body: string) => {
      const cells = body
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean)
      if (!cells.length) return ' '
      const row = cells.join(' — ')
      return /[.!?:;]$/.test(row) ? row : row + '.'
    })
    .replace(/\|/g, ' ')                            // any pipe not in a full row
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')            // heading markers
    .replace(/^\s{0,3}>\s?/gm, '')                 // blockquotes
    .replace(/^\s{0,3}[-*+]\s+/gm, '')             // list bullets
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, ' ')       // horizontal rules
    .replace(/[*_`~]/g, '')                         // emphasis / inline-code marks
    .replace(/https?:\/\/\S+/g, ' ')               // bare URLs
    .replace(/[ \t]+/g, ' ')                        // collapse spaces
    .replace(/\n{3,}/g, '\n\n')                     // collapse blank lines
    .trim()
}

// Rough prose length of a README (strip badges, code, html, headings, links).
export function proseLength(md: string): number {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~|-]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

// First real paragraph of a README → fallback blurb when there's no repo description.
export function firstParagraph(md: string): string {
  // Drop a leading YAML front-matter block (e.g. Hugging Face Spaces configs:
  // ---\n title: … sdk: … \n--- ) so it never leaks into the blurb.
  const noFrontmatter = md.replace(/^﻿?\s*---\r?\n[\s\S]*?\r?\n---\s*/, ' ')
  const clean = noFrontmatter
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^\s*#.*$/gm, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~|]/g, ' ')
  for (const para of clean.split(/\n\s*\n/)) {
    const t = para.replace(/\s+/g, ' ').trim()
    if (t.length > 40) return t.length > 240 ? t.slice(0, 237).trimEnd() + '…' : t
  }
  return ''
}
