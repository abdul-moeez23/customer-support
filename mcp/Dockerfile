FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY mcp/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Expose MCP server port
EXPOSE 8001

# Run with uvicorn — the mcp package is at /app, so we import mcp.server:app
CMD ["uvicorn", "mcp.server:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
