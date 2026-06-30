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

export const skillGroups = [
  { label: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'MATLAB', 'R', 'Bash', 'HTML', 'CSS'] },
  { label: 'Machine Learning', items: ['scikit-learn', 'XGBoost', 'LightGBM', 'CatBoost', 'SMOTE', 'SHAP', 'CausalML', 'Bayesian Optimization'] },
  { label: 'Deep Learning', items: ['PyTorch', 'TensorFlow', 'Keras', 'Transformers', 'CNNs', 'LSTM / RNN', 'Attention', 'TFT', 'Autograd'] },
  { label: 'LLMs & GenAI', items: ['RAG', 'CAG', 'LangGraph', 'LangChain', 'MCP', 'QLoRA / PEFT', 'Fine-tuning', 'LLM-as-Judge', 'Prompt Engineering', 'Hugging Face'] },
  { label: 'NLP', items: ['Hugging Face Transformers', 'spaCy', 'NLTK', 'DeBERTa', 'Embeddings', 'NER', 'Text Classification'] },
  { label: 'Retrieval & Vector DBs', items: ['FAISS', 'ChromaDB', 'Sentence-Transformers', 'all-MiniLM', 'Cosine Search', 'CLIP'] },
  { label: 'MLOps', items: ['MLflow', 'Docker', 'GitHub Actions', 'Prefect', 'Airflow', 'Evidently', 'Model Registry', 'CI/CD'] },
  { label: 'Cloud', items: ['AWS (S3, EC2, Lambda, SageMaker)', 'GCP', 'Hugging Face Spaces', 'Render', 'Vercel', 'GitHub Pages'] },
  { label: 'Backend', items: ['FastAPI', 'Flask', 'Node.js', 'REST APIs', 'PostgreSQL', 'Redis', 'Microservices', 'WebSockets'] },
  { label: 'Frontend', items: ['React', 'TypeScript', 'Tailwind CSS', 'Vite', 'Next.js', 'Framer Motion', 'Gradio', 'Streamlit'] },
  { label: 'Data & Visualization', items: ['Pandas', 'NumPy', 'Polars', 'Plotly', 'Matplotlib', 'Seaborn', 'Tableau', 'Power BI'] },
  { label: 'Big Data & Tools', items: ['PySpark', 'Spark', 'Prometheus', 'Grafana', 'Git', 'Jupyter', 'Linux', 'VS Code'] },
]

export const bio =
  "Graduate student in Data Science & AI at SFSU (GPA 3.88). I build across the full AI lifecycle — classical ML, deep-learning models, agentic systems with multi-provider LLM orchestration, RAG/CAG architectures, MLOps tooling, and full-stack product work. Currently seeking AI/ML engineering, data science, and software engineering roles."

export const links = [
  { label: 'Email', url: 'mailto:shivani.bokka93@gmail.com' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/shivani-bokka' },
  { label: 'GitHub', url: 'https://github.com/shiva-shivanibokka' },
  { label: 'Resume', url: '/resume.pdf' },
]
