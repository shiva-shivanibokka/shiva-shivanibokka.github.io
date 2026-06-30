import type { Domain, Project } from './types'

export const DOMAINS: Domain[] = [
  'Agentic',
  'LLMs & GenAI',
  'Deep Learning',
  'ML System Design',
  'MLOps',
  'Classical ML',
  'Data Science',
  'NLP',
  'Full-Stack / Product',
]

const gh = (repo: string) => `https://github.com/shiva-shivanibokka/${repo}`

const raw: Omit<Project, 'url'>[] = [
  // ---- Agentic ----
  { slug: 'autonomous-swe-agent', title: 'Autonomous SWE Agent', repo: 'Autonomous-SWE-Agent', domain: 'Agentic',
    blurb: 'A ReAct-style coding agent that plans, edits, and runs code through a typed tool registry with error short-circuiting.',
    tech: ['Python', 'LangGraph', 'ReAct', 'MCP'] },
  { slug: 'codepilot-agent', title: 'CodePilot Coding Agent', repo: 'CodePilot-Agent', domain: 'Agentic',
    blurb: 'A containerized autonomous coding assistant with a retrieval-augmented codebase indexer, a tool router, and a FastAPI + demo app.',
    tech: ['Python', 'FastAPI', 'Docker', 'RAG'] },
  { slug: 'autonomous-research-report-agent', title: 'Autonomous Research Report Agent', repo: 'Autonomous-Research-Report-Agent', domain: 'Agentic',
    blurb: 'Multi-step research agent that searches the web, reads sources, and synthesizes a cited report.',
    tech: ['Python', 'Tavily', 'LangGraph', 'LLMs'] },
  { slug: 'autonomous-ml-pipeline-builder', title: 'Autonomous ML Pipeline Builder', repo: 'Autonomous-ML-Pipeline-Builder', domain: 'Agentic',
    blurb: 'Agent that constructs and runs end-to-end ML pipelines from a dataset and a goal description.',
    tech: ['Python', 'scikit-learn', 'LLMs'] },
  { slug: 'supply-chain-demand-agent', title: 'Supply Chain Demand Agent', repo: 'Supply-Chain-Demand-Agent', domain: 'Agentic',
    blurb: 'Agentic RAG pipeline for supply-chain demand forecasting, combining LLMs, time-series models, and MLOps.',
    tech: ['Python', 'RAG', 'Time Series', 'MLOps'] },
  { slug: 'autograder-agent', title: 'AutoGrader Agent', repo: 'AutoGrader-Agent', domain: 'Agentic',
    blurb: 'Auto-grades Jupyter notebooks: parses with nbformat, applies or auto-detects a rubric, scores each criterion via a multi-step LangGraph agent, and returns structured feedback.',
    tech: ['Python', 'LangGraph', 'nbformat', 'FastAPI', 'Gradio'] },

  // ---- LLMs & GenAI ----
  { slug: 'rag-vs-cag-showdown', title: 'RAG vs CAG Showdown', repo: 'RAG-vs-CAG-Showdown', domain: 'LLMs & GenAI',
    blurb: 'Modular benchmark comparing Retrieval- vs Context-Augmented Generation on latency, token cost, and LLM-as-judge quality across factual, multi-hop, and reasoning tasks.',
    tech: ['Python', 'Claude API', 'LLM-as-judge'], metrics: ['Latency + cost + quality benchmark'] },
  { slug: 'multimodal-rag', title: 'Multimodal RAG', repo: 'Multimodal-RAG', domain: 'LLMs & GenAI',
    blurb: 'RAG over text and images with embedding-based retrieval and grounded generation.',
    tech: ['Python', 'ChromaDB', 'CLIP', 'LLMs'] },
  { slug: 'llm-hallucination-detection', title: 'LLM Hallucination Detection', repo: 'LLM-Halucination-Detection', domain: 'LLMs & GenAI',
    blurb: 'NLI-based hallucination detector: flags unsupported LLM claims with DeBERTa-v3, scores hallucination confidence per sentence, and grounds responses against sources via ChromaDB.',
    tech: ['Python', 'DeBERTa-v3', 'ChromaDB', 'Transformers'] },
  { slug: 'fine-tuned-domain-llm-qlora', title: 'Fine-Tuned Domain LLM (QLoRA)', repo: 'Fine-Tuned-Domain-LLM-QLoRA', domain: 'LLMs & GenAI',
    blurb: 'Parameter-efficient fine-tuning of an open LLM on a domain corpus using QLoRA.',
    tech: ['Python', 'PEFT', 'QLoRA', 'Transformers'] },

  // ---- Deep Learning ----
  { slug: 'super-resolution-han', title: 'Super-Resolution with HAN', repo: 'Super_Resolution_using_HAN', domain: 'Deep Learning',
    blurb: 'Single-image super-resolution using a Holistic Attention Network with residual channel attention.',
    tech: ['PyTorch', 'CNN', 'Attention'], metrics: ['SSIM / PSNR evaluated'] },
  { slug: 'multi-horizon-stock-forecasting', title: 'Multi-Horizon Stock Forecasting', repo: 'Multi-Horizon-Stock-Forecasting-AI-Model', domain: 'Deep Learning',
    blurb: 'Multi-horizon stock-price forecasting with Transformer, LSTM, RNN, and Random Forest on S&P 500 data.',
    tech: ['PyTorch', 'Transformer', 'LSTM', 'Time Series'] },
  { slug: 'all-about-neural-networks', title: 'Neural Nets From Scratch', repo: 'All-about-Neural-Networks', domain: 'Deep Learning',
    blurb: 'Neural networks and a custom autograd engine built from first principles — backprop by hand.',
    tech: ['Python', 'NumPy', 'Autograd'] },

  // ---- ML System Design ----
  { slug: 'ml-system-design-model-serving', title: 'Production Model Serving', repo: 'ML-System-Design-Model-Serving', domain: 'ML System Design',
    blurb: 'Production model serving with shadow mode, canary delivery, circuit-breaker failover, and Evidently drift detection — FastAPI + Redis + Prometheus + Grafana.',
    tech: ['FastAPI', 'Redis', 'Prometheus', 'Docker'] },
  { slug: 'ml-system-design-feature-store', title: 'End-to-End Feature Store', repo: 'ML-System-Design-Feature-Store', domain: 'ML System Design',
    blurb: 'A feature store built to Uber-Michelangelo standards that eliminates training-serving skew, the #1 silent production bug in ML systems.',
    tech: ['Python', 'Feature Store', 'System Design'] },
  { slug: 'ml-system-design-batch-inference', title: 'Batch Inference at Scale', repo: 'ML-System-Design-Batch-Inference', domain: 'ML System Design',
    blurb: 'Nightly batch scoring of 1,000,000 customers with PySpark distributed inference, Airflow orchestration, FastAPI, and a Gradio dashboard.',
    tech: ['PySpark', 'Airflow', 'FastAPI'], metrics: ['1M customers scored nightly'] },
  { slug: 'ml-system-design-recommendation-engine', title: 'Real-Time Recommendation Engine', repo: 'ML-System-Design-Recommendation-Engine', domain: 'ML System Design',
    blurb: 'A real-time recommendation system designed to the architectural standards of Netflix, Spotify, and YouTube.',
    tech: ['Python', 'RecSys', 'System Design'] },
  { slug: 'ml-system-design-retraining-pipeline', title: 'Automated Retraining Pipeline', repo: 'ML-System-Design-Retraining-Pipeline', domain: 'ML System Design',
    blurb: 'Automated model-lifecycle system for a credit-risk LightGBM model that keeps it accurate as conditions drift — orchestrated with Prefect.',
    tech: ['Python', 'LightGBM', 'Prefect', 'MLOps'] },
  { slug: 'search-ranking-system', title: 'Neural Search & Ranking System', repo: 'Search-Ranking-System', domain: 'ML System Design',
    blurb: 'Production neural search over 500k MS MARCO documents: five microservices, real-time click feedback, automated retraining, and a promotion gate — sub-200ms.',
    tech: ['Python', 'Learning-to-Rank', 'Microservices'], metrics: ['500k docs · <200ms'] },

  // ---- MLOps ----
  { slug: 'computer-vision-mlops-pipeline', title: 'Computer Vision MLOps Pipeline', repo: 'Computer-Vision-MLOps-Pipeline', domain: 'MLOps',
    blurb: 'End-to-end CV pipeline with experiment tracking, model registry, and automated retraining.',
    tech: ['Python', 'MLflow', 'Docker', 'GitHub Actions'] },
  { slug: 'ml-model-efficiency-toolkit', title: 'ML Model Efficiency Toolkit', repo: 'ML-Model-Efficiency-Toolkit', domain: 'MLOps',
    blurb: 'Tooling for quantization, pruning, and inference-cost profiling of trained models.',
    tech: ['Python', 'PyTorch', 'Quantization'] },

  // ---- Classical / Domain ML ----
  { slug: 'fraud-detection-system', title: 'Fraud Detection System', repo: 'Fraud-Detection-System', domain: 'Classical ML',
    blurb: 'Imbalanced-class fraud classifier with SMOTE, threshold calibration, and gradient-boosted trees.',
    tech: ['Python', 'XGBoost', 'SMOTE'] },
  { slug: 'churn-intelligence-platform', title: 'Churn Intelligence Platform', repo: 'Churn-Intelligence-Platform', domain: 'Classical ML',
    blurb: 'Decision-intelligence platform: behavioral segmentation → per-cohort churn prediction → causal uplift modeling (CausalML) → a 12-tool ReAct retention agent with closed-loop tracking.',
    tech: ['Python', 'CausalML', 'SHAP', 'ReAct Agent'], metrics: ['AUC 0.79–0.86 across 5 segments'] },
  { slug: 'sepsis-ml-model', title: 'Sepsis Early-Warning Model', repo: 'Sepsis-ML-Model', domain: 'Classical ML',
    blurb: 'Early sepsis prediction for ICU patients (Random Forest, XGBoost) on the PhysioNet 2019 dataset, with a full leakage-aware pipeline.',
    tech: ['Python', 'XGBoost', 'Healthcare ML'] },

  // ---- Data Science ----
  { slug: 'competitor-insight-engine', title: 'Competitor Insight Engine', repo: 'Competitor-Insight-Engine', domain: 'Data Science',
    blurb: 'Scrapes a company website, finds real-time competitors via Tavily, and generates a competitive-intelligence report with the LLM of your choice.',
    tech: ['Python', 'Tavily', 'LLMs', 'Web Scraping'] },

  // ---- NLP ----
  { slug: 'nlp-pipeline-at-scale', title: 'NLP Pipeline at Scale', repo: 'NLP-Pipeline-at-Scale', domain: 'NLP',
    blurb: 'Scalable text-processing pipeline: cleaning, embeddings, and downstream classification.',
    tech: ['Python', 'Transformers', 'NLP'] },

  // ---- Full-Stack / Product ----
  { slug: 'hireview', title: 'HireView', repo: 'HireView', domain: 'Full-Stack / Product',
    blurb: 'A job-search aggregator that scrapes Greenhouse, Lever, and Ashby ATS platforms across hundreds of career pages, returning direct-apply roles in one view.',
    tech: ['TypeScript', 'Web Scraping', 'Full-Stack'] },
  { slug: 'take-home-project', title: 'Multi-Agent Research Desk', repo: 'take-home-project', domain: 'Full-Stack / Product',
    blurb: 'Three cooperating AI agents research a topic, draft a brief, and review it — escalating low-confidence work to a human. Jobs flow through a shared Postgres queue with a live board.',
    tech: ['TypeScript', 'Postgres', 'Multi-Agent'] },
  { slug: 'resumeforge', title: 'ResumeForge', repo: 'ResumeForge', domain: 'Full-Stack / Product',
    blurb: 'AI résumé tailoring with a true one-page guarantee — live demo, CI, MIT-licensed.',
    tech: ['Python', 'LLMs', 'CI'] },
]

export const projects: Project[] = raw.map((p) => ({ ...p, url: gh(p.repo) }))
