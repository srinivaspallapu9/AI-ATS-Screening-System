import re
from services.resume_parser import extract_skills_heuristic

def summarize_resume_text(text: str) -> str:
    """
    Summarizes candidate resume into concise executive summary.
    """
    if not text:
        return "No text provided for summarization."
        
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 30]
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    
    # Extract key sections if present
    skills = extract_skills_heuristic(text)
    
    # Highlight lines with experience/projects
    key_lines = []
    keywords = ["experience", "developed", "built", "managed", "implemented", "engineer", "developer", "architect", "lead", "degree", "bachelor", "master"]
    
    for s in sentences:
        if any(k in s.lower() for k in keywords):
            key_lines.append(s)
            if len(key_lines) >= 4:
                break
                
    summary = ""
    if key_lines:
        summary += " ".join(key_lines)
    elif paragraphs:
        summary += paragraphs[0]
    else:
        summary += text[:350] + "..."
        
    if skills:
        summary += f"\n\nKey Core Competencies: {', '.join(skills[:8])}."
        
    return summary.strip()
