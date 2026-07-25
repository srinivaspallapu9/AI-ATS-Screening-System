import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from database.db import get_db
from database import models, schemas
from services.email_service import send_candidate_email

router = APIRouter()

@router.get("/stats")
def get_hr_stats(db: Session = Depends(get_db)):
    total_candidates = db.query(models.Candidate).count()
    shortlisted = db.query(models.Candidate).filter(
        models.Candidate.decision_status.in_(["AUTO_SHORTLIST", "MANUAL_SHORTLIST", "INTERVIEW", "ACCEPTED"])
    ).count()
    rejected = db.query(models.Candidate).filter(
        models.Candidate.decision_status.in_(["AUTO_REJECT", "MANUAL_REJECT", "REJECTED"])
    ).count()
    pending = db.query(models.Candidate).filter(
        models.Candidate.decision_status.in_(["PENDING", "MANUAL_REVIEW"])
    ).count()
    ai_flagged = db.query(models.Candidate).filter(models.Candidate.is_ai_flagged == True).count()
    
    avg_score_res = db.query(func.avg(models.Candidate.ats_match_score)).scalar()
    avg_score = round(float(avg_score_res), 1) if avg_score_res else 0.0
    
    return {
        "total_candidates": total_candidates,
        "shortlisted": shortlisted,
        "rejected": rejected,
        "pending": pending,
        "ai_flagged": ai_flagged,
        "avg_ats_score": avg_score
    }

@router.get("/candidates")
def list_candidates(
    job_id: Optional[int] = None,
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    ai_flagged: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Candidate)
    
    if job_id:
        query = query.filter(models.Candidate.job_id == job_id)
    if status and status != "ALL":
        query = query.filter(models.Candidate.decision_status == status)
    if min_score is not None:
        query = query.filter(models.Candidate.ats_match_score >= min_score)
    if ai_flagged is not None:
        query = query.filter(models.Candidate.is_ai_flagged == ai_flagged)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (models.Candidate.full_name.ilike(search_fmt)) |
            (models.Candidate.email.ilike(search_fmt)) |
            (models.Candidate.extracted_skills.ilike(search_fmt))
        )
        
    candidates = query.order_by(models.Candidate.created_at.desc()).all()
    
    results = []
    for c in candidates:
        results.append({
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "phone": c.phone,
            "job_id": c.job_id,
            "job_title": c.job.title if c.job else "Unspecified",
            "resume_filename": c.resume_filename,
            "extracted_skills": c.extracted_skills,
            "summary": c.summary,
            "ats_match_score": c.ats_match_score,
            "ai_content_probability": c.ai_content_probability,
            "is_ai_flagged": c.is_ai_flagged,
            "decision_status": c.decision_status,
            "decision_reason": c.decision_reason,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    return results

@router.get("/candidates/{candidate_id}")
def get_candidate_details(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    breakdown = {}
    if c.match_breakdown_json:
        try:
            breakdown = json.loads(c.match_breakdown_json)
        except Exception:
            breakdown = {}
            
    logs = db.query(models.EvaluationLog).filter(models.EvaluationLog.candidate_id == c.id).all()
    emails = db.query(models.EmailLog).filter(models.EmailLog.candidate_id == c.id).all()
    
    return {
        "id": c.id,
        "full_name": c.full_name,
        "email": c.email,
        "phone": c.phone,
        "job_id": c.job_id,
        "job_title": c.job.title if c.job else "Unspecified",
        "resume_filename": c.resume_filename,
        "parsed_text": c.parsed_text,
        "extracted_skills": c.extracted_skills,
        "summary": c.summary,
        "ats_match_score": c.ats_match_score,
        "ai_content_probability": c.ai_content_probability,
        "is_ai_flagged": c.is_ai_flagged,
        "decision_status": c.decision_status,
        "decision_reason": c.decision_reason,
        "match_breakdown": breakdown,
        "logs": [{"stage": l.stage, "message": l.message, "time": l.timestamp.strftime("%H:%M:%S")} for l in logs],
        "emails": [{"type": e.email_type, "subject": e.subject, "status": e.status, "sent_at": e.sent_at.strftime("%Y-%m-%d %H:%M")} for e in emails],
        "created_at": c.created_at.strftime("%Y-%m-%d %H:%M")
    }

@router.put("/candidates/{candidate_id}/status")
def update_candidate_status(
    candidate_id: int,
    payload: schemas.CandidateStatusUpdate,
    db: Session = Depends(get_db)
):
    c = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    old_status = c.decision_status
    c.decision_status = payload.status
    if payload.reason:
        c.decision_reason = payload.reason
        
    # Create evaluation log
    log = models.EvaluationLog(
        candidate_id=c.id,
        stage="MANUAL_STATUS_UPDATE",
        message=f"Status changed from {old_status} to {payload.status}. Reason: {payload.reason or 'Recruiter decision'}"
    )
    db.add(log)
    
    # Trigger appropriate email if status updated to INTERVIEW or SHORTLIST or REJECTED
    job_title = c.job.title if c.job else "Position"
    email_res = None
    
    if payload.status == "INTERVIEW":
        email_res = send_candidate_email(c.email, "INTERVIEW", c.full_name, job_title, payload.reason)
    elif payload.status in ["SHORTLIST", "MANUAL_SHORTLIST"]:
        email_res = send_candidate_email(c.email, "SHORTLIST", c.full_name, job_title)
    elif payload.status in ["REJECTED", "MANUAL_REJECT"]:
        email_res = send_candidate_email(c.email, "REJECTION", c.full_name, job_title, payload.reason)
        
    if email_res:
        email_log = models.EmailLog(
            candidate_id=c.id,
            recipient_email=c.email,
            subject=email_res["subject"],
            email_type=payload.status,
            content=email_res["body"],
            status=email_res["status"]
        )
        db.add(email_log)
        
    db.commit()
    
    return {
        "status": "SUCCESS",
        "candidate_id": c.id,
        "new_status": c.decision_status,
        "email_triggered": email_res is not None
    }
