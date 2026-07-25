from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database.db import get_db
from database import models, schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.JobResponse])
def get_all_jobs(db: Session = Depends(get_db)):
    return db.query(models.JobDescription).all()

@router.post("/", response_model=schemas.JobResponse)
def create_job(job_in: schemas.JobCreate, db: Session = Depends(get_db)):
    db_job = models.JobDescription(
        title=job_in.title,
        department=job_in.department,
        required_skills=job_in.required_skills,
        min_experience=job_in.min_experience,
        description=job_in.description,
        min_match_score=job_in.min_match_score,
        max_ai_content_score=job_in.max_ai_content_score
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.get("/{job_id}", response_model=schemas.JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.JobDescription).filter(models.JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job posting not found")
    return job
