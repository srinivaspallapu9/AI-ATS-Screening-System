import os
import shutil

TRASH_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "trash")

def move_to_trash(filepath: str) -> str:
    """Moves rejected resume file to trash directory."""
    if not os.path.exists(TRASH_DIR):
        os.makedirs(TRASH_DIR, exist_ok=True)
        
    if os.path.exists(filepath):
        filename = os.path.basename(filepath)
        dest = os.path.join(TRASH_DIR, filename)
        shutil.copy2(filepath, dest)
        return dest
    return filepath

def evaluate_candidate_decision(
    ats_score: float,
    ai_prob: float,
    min_match_score: float = 65.0,
    max_ai_score: float = 70.0,
    resume_filepath: str = None
) -> dict:
    """
    Automated decision pipeline determining shortlisting vs rejection.
    """
    # 1. Check AI-Generated Content Violation
    if ai_prob >= max_ai_score:
        if resume_filepath:
            move_to_trash(resume_filepath)
        return {
            "status": "AUTO_REJECT",
            "reason": f"Rejected: AI-generated content detected ({ai_prob}% exceeds limit of {max_ai_score}%)."
        }
        
    # 2. Check High ATS Fit
    if ats_score >= min_match_score:
        return {
            "status": "AUTO_SHORTLIST",
            "reason": f"Shortlisted: High ATS match score ({ats_score}% meets threshold of {min_match_score}%)."
        }
        
    # 3. Check Low ATS Fit
    if ats_score < 40.0:
        if resume_filepath:
            move_to_trash(resume_filepath)
        return {
            "status": "AUTO_REJECT",
            "reason": f"Rejected: Insufficient ATS match score ({ats_score}% is below minimum required 40%)."
        }
        
    # 4. Borderline candidate
    return {
        "status": "MANUAL_REVIEW",
        "reason": f"Pending Review: ATS score ({ats_score}%) requires HR manual decision."
    }
