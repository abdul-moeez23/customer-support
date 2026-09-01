FROM python:3.11-slim

WORKDIR /app

# Copy dependencies first for better caching
COPY requirements.txt .

# Install build dependencies required for grpcio and others
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential freetds-dev libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Run Alembic migrations then start FastAPI for development
CMD ["sh", "-c", "alembic revision --autogenerate -m 'auto' || true && alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000 "]
