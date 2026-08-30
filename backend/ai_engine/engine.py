"""
engine.py - AI Engine Orchestrator.

This is the single entry point for processing a customer message end-to-end.
It ties together:
  1. MCP Tool Discovery  → What live data can we access?
  2. Query Router        → What's the best strategy for this message?
  3. RAG Retrieval       → Fetch relevant document chunks (if needed).
  4. MCP Execution       → Query live databases (if needed).
  5. Answer Synthesis    → Feed all context to the LLM for a final response.

Usage:
    from backend.ai_engine.engine import run_ai_engine, EngineConfig, EngineResult
    
    result = run_ai_engine(
        message="What is my order status for order #1234?",
        company_id="abc-123",
        company_name="Acme Corp",
        config=EngineConfig(provider="openai"),
    )
    print(result.answer)
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from .llm_providers import chat, ProviderName
from .router import route_query, RoutingDecision
from .mcp_client import list_tools, execute_tool
from .prompts import (
    ANSWER_SYSTEM_PROMPT,
    ANSWER_USER_TEMPLATE,
    ESCALATION_MESSAGE,
)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

@dataclass
class EngineConfig:
    """Configuration for a single AI Engine run."""
    provider: ProviderName = "openai"
    router_model: str | None = None   # override for the routing LLM call
    answer_model: str | None = None   # override for the final answer LLM call
    api_key: str | None = None        # company's own API key
    rag_top_k: int = 5                # number of RAG chunks to retrieve


# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------

@dataclass
class EngineResult:
    """The full output of a single AI Engine run."""
    answer: str
    strategy: str
    reasoning: str
    escalated: bool = False
    rag_chunks: list[dict] = field(default_factory=list)
    mcp_results: dict[str, list[dict]] = field(default_factory=dict)
    tools_used: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Context builders
# ---------------------------------------------------------------------------

def _build_rag_context(chunks: list[dict]) -> str:
    """Format RAG chunks into a readable context block."""
    if not chunks:
        return ""
    parts = ["[Knowledge Base Documents]"]
    for i, chunk in enumerate(chunks, 1):
        source = chunk.get("filename", "unknown")
        score = chunk.get("score", 0)
        text = chunk.get("text", "").strip()
        parts.append(f"\nDocument {i} (source: {source}, relevance: {score:.2f}):\n{text}")
    return "\n".join(parts)


def _build_mcp_context(mcp_results: dict[str, list[dict]]) -> str:
    """Format MCP tool results into a readable context block."""
    if not mcp_results:
        return ""
    parts = ["[Live Database Results]"]
    for tool_name, rows in mcp_results.items():
        table_label = tool_name.replace("query_", "").replace("_", " ").title()
        parts.append(f"\n{table_label} ({len(rows)} row(s)):")
        if rows:
            # Show first 10 rows max in context
            for row in rows[:10]:
                parts.append("  " + json.dumps(row, default=str))
        else:
            parts.append("  (no matching records found)")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Main orchestrator
# ---------------------------------------------------------------------------

def run_ai_engine(
    message: str,
    company_id: str,
    company_name: str,
    config: EngineConfig,
    widget_purpose: str = "General Customer Support",
    widget_key: str = None
) -> EngineResult:
    """
    Process a customer message through the full AI pipeline.

    Steps:
      1. Discover MCP tools for this widget (via widget_key).
      2. Route the query to determine the best strategy.
      3. Execute RAG and/or MCP based on the routing decision.
      4. Synthesize a final answer using the gathered context.

    Args:
        message:      The customer's raw message.
        company_id:   The company's unique ID.
        company_name: The company's display name.
        config:       Engine configuration.
        widget_purpose: Behavioral prompt.
        widget_key:   The widget key to isolate tool and data access.
    """
    if config is None:
        config = EngineConfig()

    # ── Step 1: Discover available MCP tools ──────────────────────────────
    if widget_key:
        available_tools = list_tools(company_id=company_id, widget_key=widget_key)
    else:
        # Fallback for internal testing without a specific widget
        available_tools = list_tools(company_id=company_id)

    # ── Step 2: Route the query ───────────────────────────────────────────
    decision: RoutingDecision = route_query(
        message=message,
        available_tools=available_tools,
        provider=config.provider,
        model=config.router_model,
        api_key=config.api_key,
    )

    # ── Step 3: Handle immediate escalation ───────────────────────────────
    if decision.strategy == "escalate":
        return EngineResult(
            answer=ESCALATION_MESSAGE,
            strategy="escalate",
            reasoning=decision.reasoning,
            escalated=True,
        )

    # ── Step 4: Handle direct response (no tools needed) ─────────────────
    if decision.strategy == "direct":
        answer = chat(
            system=ANSWER_SYSTEM_PROMPT.format(company_name=company_name, widget_purpose=widget_purpose),
            user=ANSWER_USER_TEMPLATE.format(message=message, context="No additional context needed."),
            provider=config.provider,
            model=config.answer_model,
            api_key=config.api_key,
        )
        return EngineResult(
            answer=answer,
            strategy="direct",
            reasoning=decision.reasoning,
        )

    # ── Step 5: Gather context (RAG and/or MCP) ───────────────────────────
    rag_chunks: list[dict] = []
    mcp_results: dict[str, list[dict]] = {}
    tools_used: list[str] = []

    # RAG retrieval
    if decision.strategy in ("rag", "rag+mcp"):
        rag_chunks = _run_rag(
            query=decision.rag_search_query or message,
            company_id=company_id,
            top_k=config.rag_top_k,
            widget_key=widget_key
        )

    # MCP tool execution
    if decision.strategy in ("mcp", "rag+mcp") and available_tools:
        mcp_results, tools_used = _run_mcp_tools(
            company_id=company_id,
            message=message,
            tool_hints=decision.mcp_tool_hints,
            available_tools=available_tools,
            widget_key=widget_key
        )

    # ── Step 6: Build combined context ───────────────────────────────────
    context_parts: list[str] = []
    rag_context = _build_rag_context(rag_chunks)
    mcp_context = _build_mcp_context(mcp_results)

    if rag_context:
        context_parts.append(rag_context)
    if mcp_context:
        context_parts.append(mcp_context)

    combined_context = "\n\n".join(context_parts) if context_parts else "No relevant context found."

    # ── Step 7: Synthesize final answer ───────────────────────────────────
    answer = chat(
        system=ANSWER_SYSTEM_PROMPT.format(company_name=company_name, widget_purpose=widget_purpose),
        user=ANSWER_USER_TEMPLATE.format(message=message, context=combined_context),
        provider=config.provider,
        model=config.answer_model,
        api_key=config.api_key,
    )

    # Check if the LLM decided to escalate in the answer step
    escalated = "[ESCALATE]" in answer

    return EngineResult(
        answer=answer,
        strategy=decision.strategy,
        reasoning=decision.reasoning,
        escalated=escalated,
        rag_chunks=rag_chunks,
        mcp_results=mcp_results,
        tools_used=tools_used,
    )


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _run_rag(query: str, company_id: str, top_k: int, widget_key: str = None) -> list[dict]:
    """Run RAG retrieval and return chunks. Returns [] on error."""
    try:
        from rag_pipeline import query_documents  # relative import from backend package
        return query_documents(query, company_id, limit=top_k, widget_key=widget_key)
    except Exception as e:
        print(f"WARNING: RAG retrieval failed: {e}")
        return []


def _run_mcp_tools(
    company_id: str,
    message: str,
    tool_hints: list[str],
    available_tools: list[dict],
    widget_key: str = None
) -> tuple[dict[str, list[dict]], list[str]]:
    """
    Execute MCP tools based on the router's hints.

    Tries the hinted tools first. If hints are empty or fail, tries the
    first available tool as a best-effort fallback.

    Returns:
        A tuple of (results_dict, tools_used_list).
    """
    results: dict[str, list[dict]] = {}
    tools_used: list[str] = []

    tools_to_try = tool_hints if tool_hints else [available_tools[0]["name"]]

    for tool_name in tools_to_try:
        try:
            rows = execute_tool(
                company_id=company_id,
                tool_name=tool_name,
                arguments={},  # No filters at this stage — fetch all approved data
                widget_key=widget_key
            )
            results[tool_name] = rows
            tools_used.append(tool_name)
        except (RuntimeError, PermissionError) as e:
            print(f"WARNING: MCP tool '{tool_name}' failed: {e}")
            continue

    return results, tools_used
