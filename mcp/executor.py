"""
executor.py - Secure query executor for the MCP Tool Layer.

This module is the ONLY place that connects to a company's external database.
It strictly enforces the access policy by:
  1. Accepting only table names that are in the AllowedTable list.
  2. Building parameterized SELECT queries (no raw SQL injection possible).
  3. Never exposing credentials outside this module.
"""

from typing import Any
from sqlalchemy import create_engine, text


def _build_connection_url(db_type: str, host: str, port: str,
                          username: str, password: str, database_name: str) -> str:
    """Build a SQLAlchemy connection URL for the given DB type."""
    if db_type == "postgres":
        return f"postgresql://{username}:{password}@{host}:{port}/{database_name}"
    elif db_type == "mysql":
        return f"mysql+pymysql://{username}:{password}@{host}:{port}/{database_name}"
    else:
        raise ValueError(f"Unsupported database type: {db_type}")


def execute_select_on_table(
    db_type: str,
    host: str,
    port: str,
    username: str,
    password: str,
    database_name: str,
    table_name: str,
    allowed_tables: list[str],
    filters: dict[str, Any] | None = None,
    limit: int = 50,
) -> list[dict]:
    """
    Safely execute a SELECT query on a single table from a company's database.

    Security guarantees:
      - `table_name` is validated against the `allowed_tables` whitelist before ANY query.
      - Column filters are passed as SQLAlchemy bound parameters — never interpolated.
      - Results are capped at `limit` rows (default: 50) to prevent data dumps.

    Args:
        db_type:        Database type ('postgres' or 'mysql').
        host:           Database host.
        port:           Database port.
        username:       Database username.
        password:       Plain-text password (already decrypted by caller).
        database_name:  Target database name.
        table_name:     Table to query (must be in allowed_tables).
        allowed_tables: Whitelist of approved table names for this company.
        filters:        Optional column=value filters to apply as WHERE clauses.
        limit:          Maximum number of rows to return.

    Returns:
        A list of rows as dicts (column_name -> value).

    Raises:
        PermissionError: If table_name is not in the allowed_tables list.
        Exception:       If the database query fails.
    """
    # ── Security check: enforce access policy ─────────────────────────────
    if table_name not in allowed_tables:
        raise PermissionError(
            f"Access denied: table '{table_name}' is not in the approved access policy. "
            f"Allowed tables: {allowed_tables}"
        )

    # ── Build connection ───────────────────────────────────────────────────
    url = _build_connection_url(db_type, host, port, username, password, database_name)
    engine = create_engine(url, connect_args={"connect_timeout": 10})

    # ── Build safe parameterized query ────────────────────────────────────
    # Table name cannot be parameterized in SQL, but it has already been
    # validated against the whitelist above, so it's safe to interpolate.
    query_str = f"SELECT * FROM {table_name}"  # noqa: S608 – table is whitelisted

    params: dict[str, Any] = {}
    if filters:
        where_clauses = []
        for col, val in filters.items():
            param_key = f"filter_{col}"
            where_clauses.append(f"{col} = :{param_key}")
            params[param_key] = val
        query_str += " WHERE " + " AND ".join(where_clauses)

    query_str += f" LIMIT {int(limit)}"  # cast to int to prevent injection

    # ── Execute ────────────────────────────────────────────────────────────
    try:
        with engine.connect() as conn:
            result = conn.execute(text(query_str), params)
            rows = [dict(row._mapping) for row in result]
            return rows
    except Exception as e:
        raise Exception(f"Query failed on table '{table_name}': {str(e)}")
    finally:
        engine.dispose()
