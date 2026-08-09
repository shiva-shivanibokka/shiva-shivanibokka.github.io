import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generatedProjects } from '../src/data/projects.generated'
import { bio, experience, links, skillGroups } from '../src/data/content'

// The app is a client-rendered SPA, so the HTML Vite ships is a 851-byte shell
// whose body is one empty <div>. Googlebot executes JavaScript and copes, but
// LinkedIn/X/Slack unfurlers and most ATS and resume scrapers do not — they saw
// a blank page. This runs after `vite build` and rewrites dist/index.html to
// carry real content and real social tags, so the page says something useful
// before a single byte of JavaScript runs.
//
// The markup goes *inside* #root on purpose: React's createRoot() clears the
// container on mount, so real visitors never see it for more than the moment
// before hydration, while anything that does not run JS keeps it.

const SITE = 'https://shiva-shivanibokka.github.io'
const TITLE = 'Shivani Bokka — AI/ML Engineer'
// Deliberately "search by meaning", never "ask it anything": the page runs
// embedding similarity over the repos, with no LLM anywhere in it. This string
// is what LinkedIn and Google actually display, so it has to be true.
const DESCRIPTION =
  'AI/ML engineer building agentic systems, RAG architectures and deep-learning models. ' +
  'This portfolio runs semantic search over my repos in the browser — no server, no LLM.'

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function socialTags(): string {
  const tags: [string, string][] = [
    ['description', DESCRIPTION],
    ['author', 'Shivani Bokka'],
  ]
  const og: [string, string][] = [
    ['og:type', 'website'],
    ['og:site_name', 'Shivani Bokka'],
    ['og:title', TITLE],
    ['og:description', DESCRIPTION],
    ['og:url', SITE + '/'],
  ]
  const tw: [string, string][] = [
    ['twitter:card', 'summary_large_image'],
    ['twitter:title', TITLE],
    ['twitter:description', DESCRIPTION],
  ]
  return [
    ...tags.map(([n, c]) => `<meta name="${n}" content="${esc(c)}" />`),
    ...og.map(([p, c]) => `<meta property="${p}" content="${esc(c)}" />`),
    ...tw.map(([n, c]) => `<meta name="${n}" content="${esc(c)}" />`),
    `<link rel="canonical" href="${SITE}/" />`,
  ].join('\n    ')
}

function fallbackBody(): string {
  const projectItems = generatedProjects
    .map((p) => {
      const demo = p.demo ? ` · <a href="${esc(p.demo)}">Live demo</a>` : ''
      return (
        `<li><h3>${esc(p.title)}</h3><p>${esc(p.blurb)}</p>` +
        `<p><small>${esc(p.domain)} · ${esc(p.tech.join(', '))}</small></p>` +
        `<p><a href="${esc(p.url)}">Source</a>${demo}</p></li>`
      )
    })
    .join('\n')

  const experienceItems = experience
    .map(
      (e) =>
        `<li><h3>${esc(e.role)}</h3><p>${esc(e.org)} · ${esc(e.period)} · ${esc(e.location)}</p>` +
        `<ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></li>`,
    )
    .join('\n')

  const skills = skillGroups
    .map((g) => `<li><strong>${esc(g.label)}:</strong> ${esc(g.items.join(', '))}</li>`)
    .join('\n')

  const contact = links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(' · ')

  return `<div id="static-fallback">
      <h1>Shivani Bokka</h1>
      <p><strong>AI/ML Engineer — agents, RAG, deep learning.</strong></p>
      <p>${esc(bio)}</p>
      <p>${contact}</p>
      <h2>Projects</h2>
      <ul>
${projectItems}
      </ul>
      <h2>Experience</h2>
      <ul>
${experienceItems}
      </ul>
      <h2>Skills</h2>
      <ul>
${skills}
      </ul>
    </div>`
}

async function main() {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const dist = path.resolve(here, '..', 'dist')
  const indexFile = path.join(dist, 'index.html')

  let html = await fs.readFile(indexFile, 'utf-8')

  // Replace the hand-written description with the canonical one and add the
  // social tags Vite has no reason to know about.
  html = html.replace(/\n?\s*<meta name="description"[^>]*\/?>/i, '')
  html = html.replace('</head>', `  ${socialTags()}\n  </head>`)

  // Keep the fallback visually quiet: it exists for machines, and for the
  // fraction of a second before React clears it.
  const style =
    '<style>#static-fallback{max-width:60rem;margin:0 auto;padding:2rem 1.5rem;' +
    'color:#8b8b9e;background:#0a0a0f;font:14px/1.6 system-ui,sans-serif}' +
    '#static-fallback h1{color:#e8e8f0}#static-fallback a{color:#7dd3c0}' +
    '#static-fallback ul{list-style:none;padding:0}</style>'
  html = html.replace('</head>', `  ${style}\n  </head>`)

  if (!html.includes('<div id="root"></div>')) {
    throw new Error('dist/index.html has no empty #root — did the Vite template change?')
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${fallbackBody()}</div>`)

  await fs.writeFile(indexFile, html)

  // Crawlers ask for both of these by name; without them GitHub Pages returns
  // the SPA shell with a 404 status, which is worse than a real answer.
  await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)
  const today = new Date().toISOString().slice(0, 10)
  await fs.writeFile(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n` +
      `</urlset>\n`,
  )

  const withDemo = generatedProjects.filter((p) => p.demo).length
  console.log(
    `Static fallback written: ${generatedProjects.length} projects (${withDemo} with demos), ` +
      `${experience.length} roles, ${(html.length / 1024).toFixed(1)} KB of HTML`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
