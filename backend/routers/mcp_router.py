from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any
from services.mcp_agent import ATSMCPToolProvider

router = APIRouter()

@router.get("/tools")
def list_mcp_tools():
    """Returns available Model Context Protocol tools for ATS system."""
    return {"tools": ATSMCPToolProvider.get_available_tools()}

@router.post("/execute")
def execute_mcp_tool(payload: Dict[str, Any] = Body(...)):
    """
    Executes an MCP tool requested by external AI assistant.
    Payload: {"tool_name": "screen_resume", "arguments": {...}}
    """
    tool_name = payload.get("tool_name")
    arguments = payload.get("arguments", {})
    
    if not tool_name:
        raise HTTPException(status_code=400, detail="tool_name is required")
        
    res = ATSMCPToolProvider.execute_tool(tool_name, arguments)
    return res
