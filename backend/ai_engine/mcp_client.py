"""
mcp_client.py - HTTP client for the MCP Tool Layer server.

The AI Engine uses this client to:
  1. Discover what tools are available for a given company (list_tools).
  2. Execute a specific tool by name with arguments (execute_tool).

All calls include the shared MCP_SECRET_KEY so the MCP server can
validate that only our backend is calling it.
"""

from __future__ import annotations

import os
import httpx
from typing import Any

from dotenv import load_dotenv

load_dotenv()

MCP_SERVER_URL = os.getenv("MCP_SERVER_URL", "http://mcp:8001")
MCP_SECRET_KEY = os.getenv("MCP_SECRET_KEY", "dev-mcp-secret-change-in-production")

# Shared headers for every MCP request
_HEADERS = {"X-MCP-Secret": MCP_SECRET_KEY}

# Default timeout for MCP calls (database queries can be slow)
_TIMEOUT = 30.0


def list_tools(company_id: str, widget_key: str = None) -> list[dict]:
    """
    Fetch all available MCP tool schemas.
    """
    try:
        url = f"{MCP_SERVER_URL}/mcp/{company_id}/tools"
        if widget_key:
            url += f"?widget_key={widget_key}"
            
        with httpx.Client(timeout=_TIMEOUT) as client:
            response = client.get(url, headers=_HEADERS)
            response.raise_for_status()
            data = response.json()
            return data.get("tools", [])
    except httpx.HTTPStatusError as e:
        # 404 = company not found in MCP, 403 = bad secret
        raise RuntimeError(f"MCP server error: {e.response.status_code} — {e.response.text}")
    except (httpx.ConnectError, httpx.TimeoutException):
        # MCP server is down — return empty tools so the engine degrades gracefully
        print("WARNING: MCP server is unreachable. Proceeding without live data tools.")
        return []


def execute_tool(company_id: str, tool_name: str, arguments: dict[str, Any], widget_key: str = None) -> list[dict]:
    """
    Execute a specific MCP tool and return the results.
    """
    url = f"{MCP_SERVER_URL}/mcp/{company_id}/tools/execute"
    if widget_key:
        url += f"?widget_key={widget_key}"
    payload = {"tool_name": tool_name, "arguments": arguments}

    try:
        with httpx.Client(timeout=_TIMEOUT) as client:
            response = client.post(url, json=payload, headers=_HEADERS)

            if response.status_code == 403:
                raise PermissionError(f"MCP denied access to tool '{tool_name}': {response.text}")
            if response.status_code == 404:
                raise RuntimeError(f"Tool '{tool_name}' not found for company '{company_id}'.")

            response.raise_for_status()
            data = response.json()
            return data.get("results", [])

    except (httpx.ConnectError, httpx.TimeoutException) as e:
        raise RuntimeError(f"MCP server is unreachable: {str(e)}")
