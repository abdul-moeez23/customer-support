"""
tools.py - Dynamic MCP tool generator.

Given a company_id, this module inspects the company's DatabaseConnections
and their AllowedTables to dynamically produce a list of MCP-compatible
tool definitions that the AI engine can discover and invoke.

Each tool maps to one approved table on one of the company's connected
databases. The AI sees tools like:
  - query_orders         (from connection "Production DB", table "orders")
  - query_customers      (from connection "Production DB", table "customers")
  - query_tickets        (from connection "Support DB", table "tickets")
"""

from __future__ import annotations

from typing import Any
from sqlalchemy.orm import Session

from .database import DatabaseConnection, AllowedTable, APIConnection, AllowedEndpoint
from .encryption import decrypt
from .executor import execute_select_on_table


# ---------------------------------------------------------------------------
# Tool definition schema (MCP-compatible)
# ---------------------------------------------------------------------------

class MCPToolDefinition:
    """Represents a single callable MCP tool."""

    def __init__(
        self,
        name: str,
        description: str,
        connection_id: str,
        db_type: str,
        host: str,
        port: str,
        username: str,
        encrypted_password: str,
        database_name: str,
        table_name: str,
        allowed_tables: list[str],
    ):
        self.name = name
        self.description = description
        self.connection_id = connection_id
        self.db_type = db_type
        self.host = host
        self.port = port
        self.username = username
        self.encrypted_password = encrypted_password
        self.database_name = database_name
        self.table_name = table_name
        self.allowed_tables = allowed_tables

    def to_schema(self) -> dict:
        """Return the MCP-compatible JSON schema for this tool."""
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": {
                "type": "object",
                "properties": {
                    "filters": {
                        "type": "object",
                        "description": (
                            f"Optional key-value pairs to filter rows in the '{self.table_name}' table. "
                            "Example: {\"status\": \"active\"} or {\"order_id\": \"123\"}. "
                            "Leave empty to fetch all rows (up to 50)."
                        ),
                        "additionalProperties": True,
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of rows to return. Defaults to 20, maximum is 50.",
                        "default": 20,
                        "minimum": 1,
                        "maximum": 50,
                    },
                },
                "required": [],
            },
        }

    def execute(self, filters: dict[str, Any] | None = None, limit: int = 20) -> list[dict]:
        """Execute this tool's query and return the results."""
        plain_password = decrypt(self.encrypted_password)
        return execute_select_on_table(
            db_type=self.db_type,
            host=self.host,
            port=self.port,
            username=self.username,
            password=plain_password,
            database_name=self.database_name,
            table_name=self.table_name,
            allowed_tables=self.allowed_tables,
            filters=filters,
            limit=min(limit, 50),  # hard cap at 50
        )

class APIRESTToolDefinition:
    def __init__(
        self,
        name: str,
        description: str,
        connection_id: str,
        base_url: str,
        auth_type: str,
        encrypted_api_key: str,
        path: str,
        method: str,
    ):
        self.name = name
        self.description = description
        self.connection_id = connection_id
        self.base_url = base_url
        self.auth_type = auth_type
        self.encrypted_api_key = encrypted_api_key
        self.path = path
        self.method = method

    def to_schema(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": {
                "type": "object",
                "properties": {
                    "parameters": {
                        "type": "object",
                        "description": "Optional parameters to send with the API request.",
                        "additionalProperties": True,
                    }
                },
                "required": [],
            },
        }

    def execute(self, parameters: dict[str, Any] | None = None) -> list[dict]:
        from .executor import execute_rest_api_call
        plain_password = decrypt(self.encrypted_api_key)
        res = execute_rest_api_call(
            base_url=self.base_url,
            path=self.path,
            method=self.method,
            auth_type=self.auth_type,
            api_key=plain_password,
            parameters=parameters,
        )
        if isinstance(res, list):
            return res
        return [res]


# ---------------------------------------------------------------------------
# Tool generation
# ---------------------------------------------------------------------------

def generate_tools_for_company(company_id: str, db: Session) -> list[MCPToolDefinition]:
    """
    Inspect all DatabaseConnections and AllowedTables for a given company
    and produce a list of MCPToolDefinition objects, one per approved table.

    Args:
        company_id: The company's unique ID.
        db:         An active SQLAlchemy session connected to the main platform DB.

    Returns:
        A list of MCPToolDefinition objects ready to be called or serialized.
    """
    connections: list[DatabaseConnection] = (
        db.query(DatabaseConnection)
        .filter(DatabaseConnection.company_id == company_id)
        .all()
    )

    tools: list[MCPToolDefinition] = []

    for conn in connections:
        # Gather the approved table names for this connection
        allowed: list[AllowedTable] = (
            db.query(AllowedTable)
            .filter(AllowedTable.connection_id == conn.id)
            .all()
        )
        allowed_table_names = [at.table_name for at in allowed]

        if not allowed_table_names:
            # No tables approved for this connection — skip it
            continue

        for table_name in allowed_table_names:
            # Build a clean tool name: "query_<table>" (or "query_<conn>_<table>" if ambiguous)
            tool_name = _make_tool_name(table_name, conn.name, connections)

            tool = MCPToolDefinition(
                name=tool_name,
                description=(
                    f"Query the '{table_name}' table from the '{conn.name}' database connection. "
                    f"Returns rows matching the provided filters (up to 50 rows). "
                    f"Use this tool to fetch live data such as orders, customers, tickets, etc."
                ),
                connection_id=conn.id,
                db_type=conn.db_type,
                host=conn.host,
                port=conn.port,
                username=conn.username,
                encrypted_password=conn.encrypted_password,
                database_name=conn.database_name,
                table_name=table_name,
                allowed_tables=allowed_table_names,
            )
            tools.append(tool)

    api_connections: list[APIConnection] = (
        db.query(APIConnection)
        .filter(APIConnection.company_id == company_id)
        .all()
    )

    for api_conn in api_connections:
        endpoints: list[AllowedEndpoint] = (
            db.query(AllowedEndpoint)
            .filter(AllowedEndpoint.connection_id == api_conn.id)
            .all()
        )
        for ep in endpoints:
            ep_slug = ep.path.strip("/").replace("/", "_").replace("-", "_")
            if not ep_slug:
                ep_slug = "root"
            tool_name = f"api_{api_conn.name.lower().replace(' ', '_').replace('-', '_')[:10]}_{ep.method.lower()}_{ep_slug}"
            
            tool = APIRESTToolDefinition(
                name=tool_name,
                description=f"Call REST API {api_conn.name} endpoint {ep.method} {ep.path}. Description: {ep.description}",
                connection_id=api_conn.id,
                base_url=api_conn.base_url,
                auth_type=api_conn.auth_type,
                encrypted_api_key=api_conn.encrypted_api_key,
                path=ep.path,
                method=ep.method,
            )
            tools.append(tool) # type: ignore

    return tools


def _make_tool_name(table_name: str, connection_name: str,
                    all_connections: list[DatabaseConnection]) -> str:
    """
    Generate a clean, unique tool name for a table.

    If only one connection exists, use "query_<table>".
    If multiple connections exist, prefix with a slug of the connection name
    to avoid collisions: "query_<conn_slug>_<table>".
    """
    table_slug = table_name.lower().replace(" ", "_").replace("-", "_")

    if len(all_connections) <= 1:
        return f"query_{table_slug}"

    conn_slug = connection_name.lower().replace(" ", "_").replace("-", "_")
    # Keep it short — first 10 chars of conn name
    conn_slug = conn_slug[:10].rstrip("_")
    return f"query_{conn_slug}_{table_slug}"


# ---------------------------------------------------------------------------
# Tool registry (in-memory lookup by name)
# ---------------------------------------------------------------------------

def build_tool_registry(tools: list[MCPToolDefinition]) -> dict[str, MCPToolDefinition]:
    """Create a name -> tool mapping for fast lookup during execution."""
    return {tool.name: tool for tool in tools}
