import re
import math
import numpy as np

AI_TRIGGER_PHRASES = [
    "delve into", "testament to", "fostering", "transformative", "crucial role",
    "spearheaded the development of", "leveraging cutting-edge", "proven track record in",
    "seamless integration", "orchestrated the implementation", "demonstrated capability in",
    "highly passionate about leveraging", "robust and scalable solutions", "tapestry of",
    "in summary", "moreover", "furthermore", "consequently", "paradigm shift",
    "committed to driving innovation", "results-driven professional with extensive",
    "synergistic approach", "dynamic professional with a passion for"
]

def calculate_burstiness(sentences: list) -> float:
    """Measures variance in sentence lengths. Low variance indicates AI generation."""
    if len(sentences) < 3:
        return 50.0  # neutral
    
    lengths = [len(s.split()) for s in sentences if len(s.split()) > 0]
    if not lengths:
        return 50.0
        
    mean_len = np.mean(lengths)
    std_len = np.std(lengths)
    
    # Coefficient of Variation (CV = std / mean)
    cv = std_len / mean_len if mean_len > 0 else 0
    return float(cv)

def calculate_phrase_density(text: str) -> float:
    """Calculates density of standard LLM transition phrases."""
    text_lower = text.lower()
    matches = 0
    for phrase in AI_TRIGGER_PHRASES:
        matches += len(re.findall(r'\b' + re.escape(phrase) + r'\b', text_lower))
        
    words = len(text_lower.split())
    if words == 0:
        return 0.0
    return (matches / (words / 100)) # Matches per 100 words

def analyze_ai_probability(text: str) -> dict:
    """
    Computes AI content probability score between 0.0% and 100.0%.
    Returns detailed reasoning indicators.
    """
    if not text or len(text.strip()) < 50:
        return {
            "ai_probability": 0.0,
            "is_ai_flagged": False,
            "burstiness_score": 0.0,
            "phrase_density": 0.0,
            "risk_level": "LOW",
            "indicators": ["Text too short for reliable AI evaluation"]
        }

    # Clean sentences
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 5]
    
    cv = calculate_burstiness(sentences)
    density = calculate_phrase_density(text)
    
    # Base probability
    prob = 20.0
    indicators = []
    
    # Burstiness assessment (Low CV < 0.35 suggests AI uniform length)
    if cv < 0.30:
        prob += 35.0
        indicators.append("Extremely uniform sentence structure (low burstiness)")
    elif cv < 0.45:
        prob += 20.0
        indicators.append("Moderately uniform sentence lengths")
    else:
        indicators.append("Natural human sentence length variation")
        
    # AI Phrase density assessment
    if density > 1.5:
        prob += 35.0
        indicators.append("High concentration of characteristic AI boilerplate phrases")
    elif density > 0.8:
        prob += 20.0
        indicators.append("Presence of standard AI generative phrasing")
        
    # Bullet point repetition check
    bullets = re.findall(r'^[•\-\*]\s*(.*)$', text, flags=re.MULTILINE)
    if len(bullets) > 4:
        first_words = [b.split()[0].lower() for b in bullets if b.split()]
        if len(first_words) > 0 and (len(set(first_words)) / len(first_words)) < 0.4:
            prob += 15.0
            indicators.append("Highly repetitive bullet point structure")
            
    # Cap probability between 0 and 99
    ai_probability = round(min(max(prob, 5.0), 98.0), 1)
    is_flagged = ai_probability >= 70.0
    
    if ai_probability >= 75.0:
        risk = "HIGH"
    elif ai_probability >= 50.0:
        risk = "MEDIUM"
    else:
        risk = "LOW"
        
    return {
        "ai_probability": ai_probability,
        "is_ai_flagged": is_flagged,
        "burstiness_score": round(cv, 3),
        "phrase_density": round(density, 2),
        "risk_level": risk,
        "indicators": indicators
    }
