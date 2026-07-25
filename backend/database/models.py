import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    department = Column(String(100), default="Engineering")
    required_skills = Column(Text, nullable=False) # Comma-separated or JSON list
    min_experience = Column(Integer, default=1)
    description = Column(Text, nullable=False)
    min_match_score = Column(Float, default=65.0)
    max_ai_content_score = Column(Float, default=70.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    candidates = relationship("Candidate", back_populates="job")

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    job_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=True)
    
    resume_filename = Column(String(255), nullable=False)
    resume_filepath = Column(String(500), nullable=False)
    parsed_text = Column(Text, nullable=True)
    extracted_skills = Column(Text, nullable=True) # Comma-separated skills
    summary = Column(Text, nullable=True)
    
    ats_match_score = Column(Float, default=0.0)
    ai_content_probability = Column(Float, default=0.0)
    is_ai_flagged = Column(Boolean, default=False)
    
    # Status options: PENDING, AUTO_SHORTLIST, AUTO_REJECT, INTERVIEW, ACCEPTED, REJECTED
    decision_status = Column(String(50), default="PENDING")
    decision_reason = Column(Text, nullable=True)
    match_breakdown_json = Column(Text, nullable=True) # JSON details
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    job = relationship("JobDescription", back_populates="candidates")
    logs = relationship("EvaluationLog", back_populates="candidate", cascade="all, delete-orphan")
    emails = relationship("EmailLog", back_populates="candidate", cascade="all, delete-orphan")

class EvaluationLog(Base):
    __tablename__ = "evaluation_logs"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    stage = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    candidate = relationship("Candidate", back_populates="logs")

class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    email_type = Column(String(50), nullable=False) # ACKNOWLEDGMENT, SHORTLIST, REJECTION, INTERVIEW
    content = Column(Text, nullable=False)
    status = Column(String(50), default="SENT")
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)

    candidate = relationship("Candidate", back_populates="emails")
