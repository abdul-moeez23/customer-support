"""
server.py - MCP Tool Layer HTTP server.

This FastAPI server implements the Model Context Protocol (MCP) endpoints
that the AI Engine (Phase 5) will call to execute live data queries.

Endpoints:
  GET  /health                         → Health check
  GET  /mcp/{company_id}/tools         → List all available tools for a company
  POST /mcp/{company_id}/tools/execute → Execute a specific tool for a company

Security model:
  - Every request MUST include a valid company_id in the path.
  - Every request MUST include the MCP_SECRET_KEY header.
  - The server looks up ONLY the approved tables for that company — it is
    physically impossible to query a table outside the access policy.
  - The executor uses parameterized queries — no SQL injection possible.
  - Database passwords are always stored encrypted and decrypted in-memory only.
"""

import os
from typing import Any

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .database import get_db, Company
from .tools import generate_tools_for_company, build_tool_registry

load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Customer Support — MCP Tool Layer",
    description=(
        "Model Context Protocol server. Provides the AI Engine with secure, "
        "policy-enforced access to company databases."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restricted by MCP_SECRET_KEY header instead
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": traceback.format_exc()}
    )

# ---------------------------------------------------------------------------
# Auth: shared secret between backend AI engine and this MCP server
# ---------------------------------------------------------------------------

MCP_SECRET_KEY = os.getenv("MCP_SECRET_KEY", "dev-mcp-secret-change-in-production")


def verify_mcp_secret(x_mcp_secret: str = Header(..., alias="X-MCP-Secret")):
    """
    Dependency that validates the shared secret header.
    The AI Engine must send this header on every request.
    """
    if x_mcp_secret != MCP_SECRET_KEY:
        raise HTTPException(status_code=403, detail="Invalid MCP secret key.")
    return True


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ExecuteToolRequest(BaseModel):
    tool_name: str
    arguments: dict[str, Any] = {}


class ToolSchema(BaseModel):
    name: str
    description: str
    inputSchema: dict


class ListToolsResponse(BaseModel):
    company_id: str
    tool_count: int
    tools: list[ToolSchema]


class ExecuteToolResponse(BaseModel):
    tool_name: str
    company_id: str
    row_count: int
    results: list[dict]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_company_or_404(company_id: str, db: Session) -> Company:
    """Fetch a Company by ID or raise 404."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail=f"Company '{company_id}' not found.")
    return company


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Simple liveness probe."""
    return {"status": "healthy", "service": "mcp-tool-layer"}


@app.get(
    "/mcp/{company_id}/tools",
    response_model=ListToolsResponse,
    summary="List all MCP tools available for a company",
    description=(
        "Returns the schema of every tool the AI Engine may call on behalf of "
        "this company. Each tool corresponds to one approved table in one of "
        "the company's connected databases."
    ),
)
def list_tools(
    company_id: str,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_mcp_secret),
):
    """
    Dynamically generate and return all tools for the given company.
    The AI Engine calls this at the start of each conversation to know
    what live-data capabilities are available.
    """
    _get_company_or_404(company_id, db)

    tools = generate_tools_for_company(company_id, db)

    return ListToolsResponse(
        company_id=company_id,
        tool_count=len(tools),
        tools=[ToolSchema(**t.to_schema()) for t in tools],
    )


@app.post(
    "/mcp/{company_id}/tools/execute",
    response_model=ExecuteToolResponse,
    summary="Execute an MCP tool for a company",
    description=(
        "The AI Engine calls this endpoint to run a specific tool "
        "(i.e., query an approved table) on behalf of a company. "
        "Access policy is re-validated on every call."
    ),
)
def execute_tool(
    company_id: str,
    request: ExecuteToolRequest,
    db: Session = Depends(get_db),
    _: bool = Depends(verify_mcp_secret),
):
    """
    Execute a named tool for the given company with the provided arguments.

    The tool registry is rebuilt on every call to always reflect the latest
    access policy — if an admin removes a table from the policy, it takes
    effect immediately on the next request.
    """
    _get_company_or_404(company_id, db)

    # Rebuild tool registry fresh (always uses latest policy from DB)
    tools = generate_tools_for_company(company_id, db)
    registry = build_tool_registry(tools)

    if request.tool_name not in registry:
        available = list(registry.keys())
        raise HTTPException(
            status_code=404,
            detail=(
                f"Tool '{request.tool_name}' not found for company '{company_id}'. "
                f"Available tools: {available}"
            ),
        )

    tool = registry[request.tool_name]

    # Extract arguments
    filters: dict[str, Any] | None = request.arguments.get("filters") or None
    limit: int = int(request.arguments.get("limit", 20))

    try:
        results = tool.execute(filters=filters, limit=limit)
    except PermissionError as e:
        # Should never happen since registry is built from approved tables,
        # but kept as a double safety net.
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tool execution failed: {str(e)}")

    return ExecuteToolResponse(
        tool_name=request.tool_name,
        company_id=company_id,
        row_count=len(results),
        results=results,
    )
