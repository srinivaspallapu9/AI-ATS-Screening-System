import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base, SessionLocal
from database import models
from routers import candidate, ai_pipeline, hr, jobs, mcp_router

# Initialize DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Based ATS Resume Screening System",
    description="Intelligent Applicant Tracking System using LangChain, RAG, AI Content Detection, MCP Protocol, and Automated Decision Pipeline.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(candidate.router, prefix="/candidate", tags=["Candidate Application"])
app.include_router(hr.router, prefix="/hr", tags=["HR Dashboard"])
app.include_router(jobs.router, prefix="/jobs", tags=["Job Postings"])
app.include_router(ai_pipeline.router, prefix="/ai", tags=["AI & RAG Pipeline"])
app.include_router(mcp_router.router, prefix="/mcp", tags=["Model Context Protocol"])

@app.on_event("startup")
def seed_initial_jobs():
    """Seed initial sample job postings if database is empty."""
    db = SessionLocal()
    try:
        if db.query(models.JobDescription).count() == 0:
            sample_jobs = [
                models.JobDescription(
                    title="Senior AI / ML Engineer",
                    department="Artificial Intelligence",
                    required_skills="Python, PyTorch, TensorFlow, LangChain, RAG, Vector Databases, FastApi, Docker",
                    min_experience=3,
                    description="We are seeking an experienced AI/ML Engineer to architect end-to-end RAG systems, fine-tune LLMs, build high-performance vector retrieval pipelines, and deploy production ML microservices using FastAPI and Docker.",
                    min_match_score=70.0,
                    max_ai_content_score=65.0
                ),
                models.JobDescription(
                    title="Full Stack Software Engineer",
                    department="Engineering",
                    required_skills="React, TypeScript, JavaScript, Python, FastAPI, Node.js, SQL, PostgreSQL, HTML, CSS",
                    min_experience=2,
                    description="Looking for a versatile Full Stack Developer to build modern interactive Web applications with React, custom CSS styling, and high-speed REST APIs using Python FastAPI and SQL databases.",
                    min_match_score=65.0,
                    max_ai_content_score=70.0
                ),
                models.JobDescription(
                    title="Backend Python Developer",
                    department="Backend Infrastructure",
                    required_skills="Python, FastAPI, Django, Flask, SQL, Redis, Docker, Git, REST API",
                    min_experience=2,
                    description="Join our team as a Backend Python Engineer responsible for developing clean, scalable APIs, integrating asynchronous task queues, maintaining database schema migrations, and optimizing server performance.",
                    min_match_score=60.0,
                    max_ai_content_score=75.0
                )
            ]
            db.add_all(sample_jobs)
            db.commit()
            print("Successfully seeded initial job postings.")
    except Exception as e:
        print(f"Error seeding jobs: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "AI-Based ATS Resume Screening Engine",
        "docs": "/docs"
    }
