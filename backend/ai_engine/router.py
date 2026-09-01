"""
router.py - Query Router for the AI Engine.

The Query Router is the first step in every customer message pipeline.
It uses an LLM call to classify the message into one of 5 strategies:

  "direct"   → Simple greeting/small talk, answer without tools.
  "rag"      → Search the company knowledge base (uploaded documents).
  "mcp"      → Query live databases via the MCP tool layer.
  "rag+mcp"  → Use both RAG and MCP to build a comprehensive answer.
  "escalate" → Hand off to a human agent immediately.

The router also returns:
  - Which MCP tools to call (if any)
  - An optimized RAG search query (if RAG is needed)
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from typing import Literal

from .llm_providers import chat, ProviderName
from .prompts import ROUTER_SYSTEM_PROMPT, ROUTER_USER_TEMPLATE

Strategy = Literal["direct", "rag", "mcp", "rag+mcp", "escalate"]


@dataclass
class RoutingDecision:
    """The output of the Query Router."""
    strategy: Strategy
    reasoning: str
    mcp_tool_hints: list[str] = field(default_factory=list)
    rag_search_query: str | None = None


def route_query(
    message: str,
    available_tools: list[dict],
    provider: ProviderName = "openai",
    model: str | None = None,
    api_key: str | None = None,
) -> RoutingDecision:
    """
    Classify a customer message and decide the best strategy to answer it.

    Args:
        message:         The raw customer message.
        available_tools: List of MCP tool schema dicts (from mcp_client.list_tools).
        provider:        Which LLM provider to use for routing.
        model:           Optional model override.
        api_key:         Optional API key for the provider.

    Returns:
        A RoutingDecision describing the strategy and any tool/query hints.
    """
    # Format tool list for the prompt
    if available_tools:
        tools_text = "\n".join(
            f"  - {t['name']}: {t.get('description', '')[:120]}"
            for t in available_tools
        )
    else:
        tools_text = "  (none — no database connections configured for this company)"

    user_prompt = ROUTER_USER_TEMPLATE.format(
        message=message,
        tools_list=tools_text,
    )

    extra_instructions = ""
    if any("MongoDB" in t.get("description", "") for t in available_tools):
        extra_instructions = "- When generating logic for MongoDB tools, ensure you generate MongoDB syntax (JSON aggregation pipelines) instead of SQL."

    system_prompt = ROUTER_SYSTEM_PROMPT.format(extra_instructions=extra_instructions)

    raw_response = chat(
        system=system_prompt,
        user=user_prompt,
        provider=provider,
        model=model,
        api_key=api_key,
    )

    return _parse_routing_response(raw_response, available_tools)


def _parse_routing_response(
    raw: str,
    available_tools: list[dict],
) -> RoutingDecision:
    """
    Parse the LLM's JSON routing response into a RoutingDecision.

    Falls back to "rag" strategy if the response is malformed, so the
    engine always has a safe default path.
    """
    # Strip markdown code fences if the LLM wrapped the JSON
    cleaned = re.sub(r"```(?:json)?|```", "", raw).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        print(f"WARNING: Router returned non-JSON response: {raw[:200]}")
        return RoutingDecision(
            strategy="rag",
            reasoning="Fallback: could not parse router response.",
            rag_search_query=None,
        )

    strategy: Strategy = data.get("strategy", "rag")

    # Validate strategy is one of the known values
    valid_strategies: list[Strategy] = ["direct", "rag", "mcp", "rag+mcp", "escalate"]
    if strategy not in valid_strategies:
        strategy = "rag"

    # Validate tool hints are actually available
    available_tool_names = {t["name"] for t in available_tools}
    tool_hints = [
        t for t in data.get("mcp_tool_hints", [])
        if t in available_tool_names
    ]

    return RoutingDecision(
        strategy=strategy,
        reasoning=data.get("reasoning", ""),
        mcp_tool_hints=tool_hints,
        rag_search_query=data.get("rag_search_query") or None,
    )
