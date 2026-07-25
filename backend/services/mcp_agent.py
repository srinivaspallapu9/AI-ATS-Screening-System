import json
from typing import Dict, Any, List

class ATSMCPToolProvider:
    """
    Model Context Protocol (MCP) Tool Exposer for ATS System.
    """
    @staticmethod
    def get_available_tools() -> List[Dict[str, Any]]:
        return [
            {
                "name": "screen_resume",
                "description": "Parse resume file, analyze AI content probability, and generate summary.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "filepath": {"type": "string", "description": "Absolute path to candidate resume PDF/DOCX"}
                    },
                    "required": ["filepath"]
                }
            },
            {
                "name": "evaluate_job_match",
                "description": "Evaluate candidate resume fit against a job description.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "resume_text": {"type": "string"},
                        "job_description": {"type": "string"},
                        "required_skills": {"type": "string"}
                    },
                    "required": ["resume_text", "job_description", "required_skills"]
                }
            },
            {
                "name": "search_candidates_rag",
                "description": "Execute RAG natural language vector search across candidate database.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Natural language query e.g. 'React developers with FastAPI'"},
                        "top_k": {"type": "integer", "default": 5}
                    },
                    "required": ["query"]
                }
            },
            {
                "name": "send_candidate_email",
                "description": "Trigger automated recruitment email to candidate.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "candidate_id": {"type": "integer"},
                        "email_type": {"type": "string", "enum": ["INTERVIEW", "SHORTLIST", "REJECT", "ACKNOWLEDGMENT"]}
                    },
                    "required": ["candidate_id", "email_type"]
                }
            }
        ]

    @staticmethod
    def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if tool_name == "screen_resume":
            from services.resume_parser import extract_text, extract_skills_heuristic
            from services.ai_detector import analyze_ai_probability
            from services.ai_summary import summarize_resume_text
            
            filepath = arguments.get("filepath")
            text = extract_text(filepath)
            skills = extract_skills_heuristic(text)
            ai_eval = analyze_ai_probability(text)
            summary = summarize_resume_text(text)
            
            return {
                "status": "success",
                "extracted_skills": skills,
                "ai_evaluation": ai_eval,
                "summary": summary
            }
            
        elif tool_name == "evaluate_job_match":
            from services.job_matcher import calculate_job_match
            
            match_res = calculate_job_match(
                arguments.get("resume_text"),
                arguments.get("job_description"),
                arguments.get("required_skills")
            )
            return {"status": "success", "match": match_res}
            
        elif tool_name == "search_candidates_rag":
            from services.langchain_rag import rag_index
            
            results = rag_index.search(arguments.get("query"), arguments.get("top_k", 5))
            return {"status": "success", "query": arguments.get("query"), "results": results}
            
        else:
            return {"status": "error", "message": f"Unknown tool: {tool_name}"}
