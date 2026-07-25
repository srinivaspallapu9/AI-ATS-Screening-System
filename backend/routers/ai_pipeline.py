from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from database import schemas, models
from services.langchain_rag import rag_index

router = APIRouter()

@router.post("/rag-search")
def rag_search_candidates(payload: schemas.RAGSearchQuery, db: Session = Depends(get_db)):
    """
    RAG Vector Search across candidate resume database using LangChain.
    """
    # Build RAG index if needed from DB candidates
    if not rag_index.documents:
        candidates = db.query(models.Candidate).all()
        for c in candidates:
            rag_index.add_candidate(
                candidate_id=c.id,
                candidate_name=c.full_name,
                skills=c.extracted_skills or "",
                summary=c.summary or "",
                text=c.parsed_text or ""
            )
            
    results = rag_index.search(payload.query, payload.top_k or 5)
    return {
        "query": payload.query,
        "results": results,
        "total_results": len(results)
    }
