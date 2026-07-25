import os
from typing import List, Dict, Any
from langchain_core.documents import Document
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class CandidateRAGIndex:
    """
    RAG Index using LangChain Document representation and Semantic Vector Search
    to query candidate resumes using natural language.
    """
    def __init__(self):
        self.documents: List[Document] = []
        self.candidate_ids: List[int] = []
        self.vectorizer = TfidfVectorizer(stop_words='english')
        self.matrix = None
        self.is_built = False

    def add_candidate(self, candidate_id: int, candidate_name: str, skills: str, summary: str, text: str):
        content = f"Candidate ID: {candidate_id}\nName: {candidate_name}\nSkills: {skills}\nSummary: {summary}\nResume Text: {text}"
        doc = Document(
            page_content=content,
            metadata={
                "candidate_id": candidate_id,
                "candidate_name": candidate_name,
                "skills": skills,
                "summary": summary
            }
        )
        self.documents.append(doc)
        self.candidate_ids.append(candidate_id)
        self.is_built = False

    def build_index(self):
        if not self.documents:
            self.is_built = False
            return
            
        corpus = [doc.page_content for doc in self.documents]
        self.matrix = self.vectorizer.fit_transform(corpus)
        self.is_built = True

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        RAG vector search returning ranked list of candidates matching the natural language query.
        """
        if not self.documents:
            return []
            
        if not self.is_built:
            self.build_index()
            
        try:
            query_vec = self.vectorizer.transform([query])
            similarities = cosine_similarity(query_vec, self.matrix)[0]
            
            top_indices = np.argsort(similarities)[::-1][:top_k]
            results = []
            
            for idx in top_indices:
                score = float(similarities[idx])
                if score > 0.01:
                    doc = self.documents[idx]
                    results.append({
                        "candidate_id": doc.metadata["candidate_id"],
                        "candidate_name": doc.metadata["candidate_name"],
                        "skills": doc.metadata["skills"],
                        "summary": doc.metadata["summary"],
                        "relevance_score": round(score * 100, 1),
                        "snippet": doc.page_content[:300] + "..."
                    })
                    
            return results
        except Exception as e:
            print(f"RAG search error: {e}")
            return []

# Global RAG singleton instance
rag_index = CandidateRAGIndex()
