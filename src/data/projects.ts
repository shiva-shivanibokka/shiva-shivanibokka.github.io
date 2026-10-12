// The project list the app renders and the RAG index embeds.
//
// Generated into src/data/projects.generated.ts by scripts/build-projects.ts on
// each build / CI run, from the curated list in that script. Which projects
// appear, in what order, with what one-line pitch and what measured finding, is
// decided there; tech tags and whether a demo is still answering are read from
// each repo at build time, so a redeploy or a README edit still flows through.
//
// To add or remove a project, edit CURATED in scripts/build-projects.ts.
import { generatedProjects } from './projects.generated'
export { DOMAINS } from './types'

export const projects = generatedProjects
