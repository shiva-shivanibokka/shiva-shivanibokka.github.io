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
  pytorch: 'ML & AI', tensorflow: 'ML & AI', keras: 'ML & AI', jax: 'ML & AI', 'scikit-learn': 'ML & AI',
  xgboost: 'ML & AI', catboost: 'ML & AI', lightgbm: 'ML & AI', onnx: 'ML & AI', opencv: 'ML & AI',
  transformers: 'ML & AI', 'sentence-transformers': 'ML & AI', peft: 'ML & AI', trl: 'ML & AI', bitsandbytes: 'ML & AI',
  vllm: 'ML & AI', langgraph: 'ML & AI', langchain: 'ML & AI', llamaindex: 'ML & AI', rag: 'ML & AI', faiss: 'ML & AI',
  chromadb: 'ML & AI', pinecone: 'ML & AI', weaviate: 'ML & AI', qdrant: 'ML & AI', lora: 'ML & AI', mcp: 'ML & AI',
  openai: 'ML & AI', anthropic: 'ML & AI', gemini: 'ML & AI', groq: 'ML & AI', cohere: 'ML & AI', ollama: 'ML & AI',
  spacy: 'ML & AI', nltk: 'ML & AI', deberta: 'ML & AI', optuna: 'ML & AI',
  // Backend / APIs / data stores
  fastapi: 'Backend', flask: 'Backend', django: 'Backend', uvicorn: 'Backend', pydantic: 'Backend',
  sqlalchemy: 'Backend', 'node.js': 'Backend', express: 'Backend', graphql: 'Backend', prisma: 'Backend',
  postgres: 'Backend', postgresql: 'Backend', mysql: 'Backend', mongodb: 'Backend', redis: 'Backend',
  celery: 'Backend', supabase: 'Backend',
  // Frontend / app UIs
  react: 'Frontend', 'next.js': 'Frontend', vue: 'Frontend', svelte: 'Frontend', tailwind: 'Frontend',
  vite: 'Frontend', 'framer motion': 'Frontend', 'shadcn/ui': 'Frontend', 'radix ui': 'Frontend',
  'material ui': 'Frontend', 'chakra ui': 'Frontend', bootstrap: 'Frontend', 'styled-components': 'Frontend',
  redux: 'Frontend', zustand: 'Frontend', 'tanstack query': 'Frontend', 'three.js': 'Frontend',
  'd3.js': 'Frontend', 'chart.js': 'Frontend', recharts: 'Frontend', axios: 'Frontend',
  gradio: 'Frontend', streamlit: 'Frontend',
  // shared / infra extras
  zod: 'Backend', vercel: 'MLOps / Infra', netlify: 'MLOps / Infra',
  // Data
  numpy: 'Data', pandas: 'Data', polars: 'Data', duckdb: 'Data', scipy: 'Data', statsmodels: 'Data',
  matplotlib: 'Data', seaborn: 'Data', plotly: 'Data', pyspark: 'Data', airflow: 'Data', dbt: 'Data',
  kafka: 'Data', tableau: 'Data', 'power bi': 'Data',
  // MLOps / Infra
  docker: 'MLOps / Infra', kubernetes: 'MLOps / Infra', terraform: 'MLOps / Infra', 'github actions': 'MLOps / Infra',
  mlflow: 'MLOps / Infra', 'weights & biases': 'MLOps / Infra', dvc: 'MLOps / Infra', ray: 'MLOps / Infra',
  pytest: 'MLOps / Infra', aws: 'MLOps / Infra', gcp: 'MLOps / Infra', azure: 'MLOps / Infra',
  playwright: 'MLOps / Infra', beautifulsoup: 'MLOps / Infra',
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
