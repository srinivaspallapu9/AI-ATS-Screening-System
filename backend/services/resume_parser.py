import os
import re
from pypdf import PdfReader
from docx import Document

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
    except Exception as e:
        print(f"Error reading PDF {file_path}: {e}")
    return text.strip()

def extract_text_from_docx(file_path: str) -> str:
    text = ""
    try:
        doc = Document(file_path)
        for para in doc.paragraphs:
            if para.text:
                text += para.text + "\n"
    except Exception as e:
        print(f"Error reading DOCX {file_path}: {e}")
    return text.strip()

def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    elif ext == ".txt":
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    else:
        raise ValueError(f"Unsupported file format: {ext}")

def extract_contact_info(text: str) -> dict:
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    
    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text)
    
    return {
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None
    }

def extract_skills_heuristic(text: str) -> list:
    common_skills = [
        "python", "java", "c++", "c#", "javascript", "typescript", "react", "angular", "vue",
        "node.js", "express", "fastapi", "flask", "django", "sql", "postgresql", "mysql",
        "mongodb", "sqlite", "redis", "docker", "kubernetes", "aws", "azure", "gcp",
        "git", "ci/cd", "rest api", "graphql", "machine learning", "deep learning", "nlp",
        "spacy", "langchain", "rag", "tensorflow", "pytorch", "scikit-learn", "pandas",
        "numpy", "opencv", "html", "css", "tailwind", "bootstrap", "agile", "scrum", "jira"
    ]
    
    text_lower = text.lower()
    found_skills = []
    for skill in common_skills:
        # Match as whole word or boundary
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill.title() if len(skill) <= 4 else skill.capitalize())
            
    return sorted(list(set(found_skills)))
