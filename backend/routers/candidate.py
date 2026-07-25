import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database.db import get_db
from database import models, schemas
from services.resume_parser import extract_text, extract_skills_heuristic
from services.ai_detector import analyze_ai_probability
from services.ai_summary import summarize_resume_text
from services.job_matcher import calculate_job_match
from services.decision_engine import evaluate_candidate_decision
from services.email_service import send_candidate_email
from services.langchain_rag import rag_index

router = APIRouter()

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

@router.post("/apply")
async def apply_candidate(
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    job_id: int = Form(...),
    resume: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not os.path.exists(UPLOADS_DIR):
        os.makedirs(UPLOADS_DIR, exist_ok=True)
        
    # Check Job exists
    job = db.query(models.JobDescription).filter(models.JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=400, detail="Selected job posting does not exist.")
        
    # Save file
    file_ext = os.path.splitext(resume.filename)[1].lower()
    if file_ext not in [".pdf", ".docx", ".doc", ".txt"]:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are accepted.")
        
    unique_filename = f"{uuid.uuid4().hex[:8]}_{resume.filename}"
    filepath = os.path.join(UPLOADS_DIR, unique_filename)
    
    content = await resume.read()
    with open(filepath, "wb") as f:
        f.write(content)
        
    # 1. Parse Text
    parsed_text = extract_text(filepath)
    extracted_skills_list = extract_skills_heuristic(parsed_text)
    extracted_skills_str = ", ".join(extracted_skills_list)
    
    # 2. AI Content Detection
    ai_eval = analyze_ai_probability(parsed_text)
    ai_prob = ai_eval["ai_probability"]
    is_ai_flagged = ai_eval["is_ai_flagged"]
    
    # 3. AI Summary
    summary = summarize_resume_text(parsed_text)
    
    # 4. Job Match
    match_result = calculate_job_match(
        resume_text=parsed_text,
        job_description=job.description,
        required_skills_str=job.required_skills
    )
    ats_score = match_result["ats_match_score"]
    
    # 5. Automated Decision Engine
    decision = evaluate_candidate_decision(
        ats_score=ats_score,
        ai_prob=ai_prob,
        min_match_score=job.min_match_score,
        max_ai_score=job.max_ai_content_score,
        resume_filepath=filepath
    )
    
    # 6. Save Candidate DB Record
    candidate = models.Candidate(
        full_name=full_name,
        email=email,
        phone=phone,
        job_id=job_id,
        resume_filename=resume.filename,
        resume_filepath=filepath,
        parsed_text=parsed_text,
        extracted_skills=extracted_skills_str,
        summary=summary,
        ats_match_score=ats_score,
        ai_content_probability=ai_prob,
        is_ai_flagged=is_ai_flagged,
        decision_status=decision["status"],
        decision_reason=decision["reason"],
        match_breakdown_json=json.dumps({
            "ai_evaluation": ai_eval,
            "match_result": match_result
        })
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    # 7. Add Candidate to RAG Vector Index
    rag_index.add_candidate(
        candidate_id=candidate.id,
        candidate_name=full_name,
        skills=extracted_skills_str,
        summary=summary,
        text=parsed_text
    )
    
    # 8. Log evaluation stage
    eval_log = models.EvaluationLog(
        candidate_id=candidate.id,
        stage="INITIAL_SCREENING",
        message=f"Screening completed: ATS Score={ats_score}%, AI Content Prob={ai_prob}%, Status={decision['status']}"
    )
    db.add(eval_log)
    
    # 9. Trigger Email Notification
    if decision["status"] == "AUTO_SHORTLIST":
        email_res = send_candidate_email(email, "SHORTLIST", full_name, job.title)
    elif decision["status"] == "AUTO_REJECT":
        email_res = send_candidate_email(email, "REJECTION", full_name, job.title, decision["reason"])
    else:
        email_res = send_candidate_email(email, "ACKNOWLEDGMENT", full_name, job.title)
        
    email_log = models.EmailLog(
        candidate_id=candidate.id,
        recipient_email=email,
        subject=email_res["subject"],
        email_type=decision["status"],
        content=email_res["body"],
        status=email_res["status"]
    )
    db.add(email_log)
    db.commit()
    
    return {
        "status": "SUCCESS",
        "candidate_id": candidate.id,
        "full_name": full_name,
        "ats_match_score": ats_score,
        "ai_content_probability": ai_prob,
        "decision_status": decision["status"],
        "decision_reason": decision["reason"],
        "extracted_skills": extracted_skills_list,
        "summary": summary
    }

@router.get("/{candidate_id}/status")
def get_candidate_status(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    job_title = c.job.title if c.job else "General Position"
    return {
        "candidate_id": c.id,
        "full_name": c.full_name,
        "job_title": job_title,
        "decision_status": c.decision_status,
        "ats_match_score": c.ats_match_score,
        "ai_content_probability": c.ai_content_probability,
        "applied_date": c.created_at.strftime("%Y-%m-%d %H:%M")
    }
