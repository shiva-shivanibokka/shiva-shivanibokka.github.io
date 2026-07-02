// Buckets a flat tech list into colored, headed categories for the project cards
// (Languages · ML & AI · Backend · Frontend · Data · MLOps / Infra · Other).

export type TechCat = 'Languages' | 'ML & AI' | 'Backend' | 'Frontend' | 'Data' | 'MLOps / Infra' | 'Other'

export const CAT_ORDER: TechCat[] = ['Languages', 'ML & AI', 'Backend', 'Frontend', 'Data', 'MLOps / Infra', 'Other']

export const CAT_COLOR: Record<TechCat, string> = {
  Languages: '#60a5fa',
  'ML & AI': '#a78bfa',
  Backend: '#34d399',
  Frontend: '#fb923c',
  Data: '#22d3ee',
  'MLOps / Infra': '#fbbf24',
  Other: '#9ca3af',
}

const MAP: Record<string, TechCat> = {
  // Languages
  python: 'Languages', typescript: 'Languages', javascript: 'Languages', java: 'Languages', 'c++': 'Languages',
  'c#': 'Languages', go: 'Languages', rust: 'Languages', ruby: 'Languages', r: 'Languages', matlab: 'Languages',
  sql: 'Languages', plpgsql: 'Languages', 'jupyter notebook': 'Languages', html: 'Languages', css: 'Languages',
  // ML & AI
  pytorch: 'ML & AI', tensorflow: 'ML & AI', keras: 'ML & AI', 'scikit-learn': 'ML & AI', xgboost: 'ML & AI',
  catboost: 'ML & AI', lightgbm: 'ML & AI', transformers: 'ML & AI', rag: 'ML & AI', faiss: 'ML & AI',
  chromadb: 'ML & AI', lora: 'ML & AI', langgraph: 'ML & AI', langchain: 'ML & AI', mcp: 'ML & AI',
  openai: 'ML & AI', anthropic: 'ML & AI', ollama: 'ML & AI',
  // Backend
  fastapi: 'Backend', flask: 'Backend', django: 'Backend', 'node.js': 'Backend', express: 'Backend',
  postgres: 'Backend', postgresql: 'Backend', mongodb: 'Backend', redis: 'Backend', pydantic: 'Backend',
  // Frontend / app UIs
  react: 'Frontend', 'next.js': 'Frontend', tailwind: 'Frontend', vite: 'Frontend', vue: 'Frontend',
  gradio: 'Frontend', streamlit: 'Frontend',
  // Data
  numpy: 'Data', pandas: 'Data', plotly: 'Data', matplotlib: 'Data', seaborn: 'Data', tableau: 'Data',
  // MLOps / Infra
  docker: 'MLOps / Infra', mlflow: 'MLOps / Infra', aws: 'MLOps / Infra', gcp: 'MLOps / Infra',
  kubernetes: 'MLOps / Infra', 'github actions': 'MLOps / Infra', playwright: 'MLOps / Infra',
}

export function catOf(tech: string): TechCat {
  return MAP[tech.toLowerCase()] || 'Other'
}

// Group a project's tech into ordered [category, items] pairs (empty cats dropped).
export function groupTech(tech: string[]): [TechCat, string[]][] {
  const groups = new Map<TechCat, string[]>()
  for (const t of tech) {
    const c = catOf(t)
    if (!groups.has(c)) groups.set(c, [])
    groups.get(c)!.push(t)
  }
  return CAT_ORDER.filter((c) => groups.has(c)).map((c) => [c, groups.get(c)!])
}
