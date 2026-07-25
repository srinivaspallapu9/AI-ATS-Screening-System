import re
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from services.resume_parser import extract_skills_heuristic

def clean_skill(skill: str) -> str:
    return skill.strip().lower()

def calculate_job_match(resume_text: str, job_description: str, required_skills_str: str) -> dict:
    """
    Evaluates candidate ATS match against Job Description.
    Calculates TF-IDF vector similarity & skill overlap.
    """
    if not resume_text or not job_description:
        return {
            "ats_match_score": 0.0,
            "matched_skills": [],
            "missing_skills": [],
            "fit_level": "POOR",
            "similarity_score": 0.0,
            "skill_score": 0.0
        }
        
    # 1. Parse Required Skills
    req_skills_list = []
    if required_skills_str:
        if "," in required_skills_str:
            req_skills_list = [clean_skill(s) for s in required_skills_str.split(",") if s.strip()]
        else:
            req_skills_list = [clean_skill(s) for s in required_skills_str.split() if s.strip()]
            
    # Also extract auto-detected skills from job description text
    auto_jd_skills = [clean_skill(s) for s in extract_skills_heuristic(job_description)]
    all_target_skills = list(set(req_skills_list + auto_jd_skills))
    
    # 2. Extract Candidate Skills
    candidate_skills = [clean_skill(s) for s in extract_skills_heuristic(resume_text)]
    
    # 3. Match Skills
    matched_skills = []
    missing_skills = []
    resume_lower = resume_text.lower()
    
    for skill in all_target_skills:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if skill in candidate_skills or re.search(pattern, resume_lower):
            matched_skills.append(skill.title())
        else:
            missing_skills.append(skill.title())
            
    skill_score = 0.0
    if all_target_skills:
        skill_score = (len(matched_skills) / len(all_target_skills)) * 100.0
    else:
        skill_score = 70.0  # Default if no specific skills declared
        
    # 4. TF-IDF Text Similarity
    similarity_score = 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        similarity_score = float(similarity) * 100.0
    except Exception as e:
        print(f"Error computing TF-IDF similarity: {e}")
        similarity_score = 50.0
        
    # 5. Composite ATS Score (60% Skill Match + 40% Text Similarity)
    composite_score = (skill_score * 0.60) + (similarity_score * 0.40)
    ats_match_score = round(min(max(composite_score, 0.0), 99.0), 1)
    
    # Fit Level Categorization
    if ats_match_score >= 80.0:
        fit_level = "EXCELLENT"
    elif ats_match_score >= 65.0:
        fit_level = "GOOD"
    elif ats_match_score >= 45.0:
        fit_level = "MODERATE"
    else:
        fit_level = "POOR"
        
    breakdown = {
        "ats_match_score": ats_match_score,
        "matched_skills": sorted(matched_skills),
        "missing_skills": sorted(missing_skills),
        "fit_level": fit_level,
        "similarity_score": round(similarity_score, 1),
        "skill_score": round(skill_score, 1)
    }
    
    return breakdown
