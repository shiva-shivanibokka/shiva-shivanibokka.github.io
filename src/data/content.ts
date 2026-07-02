export interface ExperienceItem {
  role: string
  org: string
  period: string
  kind: string
  location: string
  bullets: string[]
}

export const experience: ExperienceItem[] = [
  {
    role: 'Graduate Student — M.S. Data Science & Artificial Intelligence',
    org: 'San Francisco State University',
    period: 'Aug 2024 – Dec 2026',
    kind: 'Full-time',
    location: 'San Francisco Bay Area · On-site',
    bullets: [
      'Pursuing a Master’s in Data Science & Artificial Intelligence (Batch of Fall 2024).',
      'Coursework across deep learning, data visualization, machine learning, and applied AI systems.',
    ],
  },
  {
    role: 'Teaching Assistant — Data Science & Machine Learning Program',
    org: 'San Francisco State University · College of Professional & Global Education',
    period: 'Aug 2025 – Present',
    kind: 'Part-time',
    location: 'San Francisco, CA · Remote',
    bullets: [
      'TA for the Data Science & ML Professional Certificate, working under Prof. Anagha Kulkarni (Director & Founder) and Instructor Mark Kim.',
      'Facilitate weekly discussion sessions, clarify technical concepts, and guide students through assignments and projects spanning programming, data analysis, machine learning, and AI applications in biotechnology.',
      'Support modules across Foundations in Computing & Data Structures, Machine Learning for Personalized Medicine, Intermediate ML for Interdisciplinary Data Scientists, and ML for Medical Image Analysis.',
      'Help learners strengthen both theoretical understanding and practical skills (Python, PyTorch, and more).',
    ],
  },
  {
    role: 'Vice President of Finance & Chair, Finance Committee',
    org: 'Associated Students, San Francisco State University',
    period: 'Jun 2025 – May 2026',
    kind: 'Part-time',
    location: 'San Francisco, CA · On-site',
    bullets: [
      'Elected Vice President of Finance & Chair of the Finance Committee on the Associated Students Board of Directors (Fall 2025).',
      'Lead budgeting and fund-allocation efforts, oversee financial planning, and represent student financial interests across campus initiatives.',
      'As Chair, develop and review student-government budgets, facilitate committee discussions, and evaluate funding proposals to support student services, events, and organizations.',
      'Collaborate with university departments to uphold transparency and financial accountability.',
    ],
  },
  {
    role: 'Teaching Assistant — PINC (Promoting Inclusivity in Computing)',
    org: 'San Francisco State University',
    period: 'Aug 2025 – Dec 2025',
    kind: 'Part-time',
    location: 'San Francisco, CA · Hybrid',
    bullets: [
      'TA for the PINC program under Prof. Anagha Kulkarni, building computing, data science, and ML skills for students from diverse and underrepresented backgrounds.',
      'Facilitate weekly discussion sessions, assist with technical concepts, and support students on programming, data analysis, and machine learning projects.',
      'Cover Foundations in Computing & Data Structures, Core & Intermediate ML and Data Analysis, and applications including ML for Personalized Medicine and Medical Image Analysis.',
      'Foster an inclusive, supportive learning environment that strengthens both theoretical understanding and practical application.',
    ],
  },
  {
    role: 'Teaching Assistant — Pattern Analysis & Machine Intelligence',
    org: 'San Francisco State University',
    period: 'Feb 2025 – May 2025',
    kind: 'Part-time',
    location: 'San Francisco Bay Area · Remote',
    bullets: [
      'Led 2-hour weekly sessions, using examples and open discussion to simplify complex topics and boost engagement.',
      'Supported 40+ students with MATLAB programming — troubleshooting code, applying concepts, and building technical confidence.',
      'Graded assignments, projects, and exams using clear rubrics, with thoughtful, personalized feedback to support learning.',
    ],
  },
  {
    role: 'Teaching Assistant — Probability & Statistics',
    org: 'San Francisco State University',
    period: 'Feb 2025 – May 2025',
    kind: 'Part-time',
    location: 'San Francisco Bay Area · Remote',
    bullets: [
      'Facilitated weekly one-hour sessions for Probability & Statistics I, using guided discussion and problem-solving to reinforce core concepts.',
      'Provided academic support to 40+ students — addressing questions, clarifying difficult topics, and offering step-by-step guidance through complex problems.',
      'Graded 24+ assignments, quizzes, and exams with precision, delivering constructive feedback to strengthen understanding and performance.',
    ],
  },
]

// Skills grouped and colored. Enriched from the tech detected across the repos
// shown on this site; each group has a color used for its heading + chips.
export interface SkillGroup {
  label: string
  color: string
  items: string[]
}
export const skillGroups: SkillGroup[] = [
  { label: 'Languages', color: '#60a5fa', items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'MATLAB', 'R', 'Bash', 'HTML', 'CSS'] },
  { label: 'Machine Learning', color: '#a78bfa', items: ['scikit-learn', 'XGBoost', 'LightGBM', 'CatBoost', 'Optuna', 'SMOTE', 'SHAP', 'Bayesian Optimization', 'Feature Engineering'] },
  { label: 'Deep Learning', color: '#f472b6', items: ['PyTorch', 'TensorFlow', 'Keras', 'JAX', 'Transformers', 'CNNs', 'LSTM / RNN', 'Attention', 'TFT / PatchTST', 'ONNX', 'Autograd'] },
  { label: 'LLMs & GenAI', color: '#34d399', items: ['RAG', 'CAG', 'LangGraph', 'LangChain', 'LlamaIndex', 'MCP', 'QLoRA / PEFT', 'TRL / DPO', 'Fine-tuning', 'OpenAI', 'Anthropic', 'Gemini', 'Groq', 'Cohere', 'Ollama', 'vLLM', 'LLM-as-Judge', 'Prompt Engineering'] },
  { label: 'NLP', color: '#22d3ee', items: ['Hugging Face Transformers', 'spaCy', 'NLTK', 'DeBERTa', 'Embeddings', 'NER', 'Text Classification'] },
  { label: 'Retrieval & Vector DBs', color: '#fbbf24', items: ['FAISS', 'ChromaDB', 'Qdrant', 'Pinecone', 'Weaviate', 'Sentence-Transformers', 'all-MiniLM', 'Cosine Search', 'CLIP'] },
  { label: 'MLOps', color: '#fb923c', items: ['MLflow', 'Docker', 'GitHub Actions', 'Weights & Biases', 'DVC', 'Airflow', 'Kubernetes', 'pytest', 'Model Registry', 'Drift Detection', 'CI/CD'] },
  { label: 'Cloud', color: '#818cf8', items: ['AWS (S3, EC2, Lambda, SageMaker)', 'GCP', 'Azure', 'Hugging Face Spaces', 'Vercel', 'Netlify', 'Render', 'GitHub Pages'] },
  { label: 'Backend', color: '#2dd4bf', items: ['FastAPI', 'Flask', 'Django', 'uvicorn', 'Pydantic', 'SQLAlchemy', 'Node.js', 'GraphQL', 'REST APIs', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Celery'] },
  { label: 'Frontend', color: '#e879f9', items: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vite', 'Framer Motion', 'Redux', 'Gradio', 'Streamlit'] },
  { label: 'Data & Visualization', color: '#38bdf8', items: ['Pandas', 'NumPy', 'Polars', 'DuckDB', 'SciPy', 'statsmodels', 'Plotly', 'Matplotlib', 'Seaborn', 'Tableau', 'Power BI'] },
  { label: 'Big Data & Tools', color: '#94a3b8', items: ['PySpark', 'Kafka', 'BeautifulSoup', 'Playwright', 'Git', 'Jupyter', 'Linux', 'VS Code'] },
]

export const bio =
  "Graduate student in Data Science & AI at SFSU (GPA 3.88). I build across the full AI lifecycle — classical ML, deep-learning models, agentic systems with multi-provider LLM orchestration, RAG/CAG architectures, MLOps tooling, and full-stack product work. Currently seeking AI/ML engineering, data science, and software engineering roles."

export const links = [
  { label: 'Email', url: 'mailto:shivani.bokka93@gmail.com' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/shivani-bokka' },
  { label: 'GitHub', url: 'https://github.com/shiva-shivanibokka' },
  { label: 'Resume', url: '/resume.pdf' },
]
