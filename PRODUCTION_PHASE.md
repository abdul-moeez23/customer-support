# Production Phase: Robust RAG Architecture & Async Processing

This phase outlines the transition of the RAG system from a synchronous, API-dependent flow to an enterprise-grade, highly scalable, and self-hosted architecture. 

## 1. Architecture Components Added
To achieve production readiness, the following infrastructure components will be introduced into the stack (via `docker-compose`):

*   **MinIO (S3-Compatible Storage):** To permanently and securely store the original raw uploaded documents (Source of Truth).
*   **Redis:** To act as the message broker and queue manager for background tasks.
*   **Celery Worker:** A dedicated Python background worker to offload heavy text extraction and ML embedding tasks from the main FastAPI server.
*   **all-MiniLM-L6-v2:** A fast, highly efficient open-source sentence transformer model that replaces OpenAI API calls, running locally to eliminate embedding costs and network latency.

---

## 2. The Complete Data Flow

Here is the exact step-by-step flow of a document once this phase is implemented:

### Step A: Secure Upload (Main FastAPI Server)
1.  The user uploads a PDF from the Next.js frontend to the FastAPI backend.
2.  The FastAPI backend encrypts the raw file bytes in memory (Client-Side Encryption) for an extra layer of security.
3.  The encrypted file is uploaded to **MinIO**.
4.  FastAPI saves a record in the PostgreSQL database: `Document(id, minio_url, status='processing')`.
5.  FastAPI queues a job in **Redis** containing the document ID and immediately returns a `202 Accepted` response to the frontend, freeing up the server instantly.

### Step B: Async Processing (Celery Worker)
6.  The **Celery Worker** picks up the job from Redis.
7.  Celery downloads the encrypted file from MinIO and decrypts it.
8.  **Text Extraction:** It extracts text using `pypdf`. 
    > [!TIP]
    > **Future Upgrade Path:** If you run into issues later with complex PDFs (e.g., scanned images, double columns, tables), you might want to consider upgrading this extraction step to an OCR-based library (like `pytesseract` or `pdfplumber`) or a cloud extraction API (like AWS Textract or Unstructured.io).
9.  **Chunking:** The text is split into logical overlapping chunks using LangChain.
10. **Local Embedding:** The Celery worker passes the chunks through the local `all-MiniLM-L6-v2` model to generate vectors instantly.
11. **Vector Storage:** The vectors are saved to **Qdrant**, tagged with the MinIO URL/Document ID as metadata for future citation.
12. Celery updates the PostgreSQL database status to `'completed'`.

---

## 3. Configuration Details

### S3 / MinIO Configuration
When configuring the S3 client to communicate with MinIO, you must explicitly define the endpoint and force path-style addressing. 

**If uploading via Node.js / Next.js (AWS SDK v3):**
```javascript
const { S3Client } = require("@aws-sdk/client-s3");

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  endpoint: process.env.S3_ENDPOINT, // <-- Add this for MinIO
  forcePathStyle: true,              // <-- Crucial for MinIO buckets
});
```

**If uploading via Python / FastAPI (Boto3):**
```python
import boto3
from botocore.client import Config

s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_ENDPOINT'), # <-- Add this for MinIO
    aws_access_key_id=os.getenv('MINIO_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('MINIO_SECRET_KEY'),
    config=Config(s3={'addressing_style': 'path'}) # <-- Crucial for MinIO buckets
)
```

### Encryption Layer
Before pushing to MinIO, files should undergo **AES-256 GCM encryption**. 
*   **Why?** Even if someone gains access to the MinIO buckets, the raw documents remain unreadable without the specific application decryption key.
*   When Celery retrieves the file, it will dynamically decrypt it in memory before feeding it to the text extractor, ensuring data is never written to a local disk unencrypted.

### Embedding Model Configuration
Replace the OpenAI API call with the `sentence-transformers` library:
```python
from sentence_transformers import SentenceTransformer

# Load the model once in the Celery worker memory
model = SentenceTransformer('all-MiniLM-L6-v2')

# Generate embeddings locally and for free
embeddings = model.encode(chunks).tolist()
```

---

## 4. Implementation Plan (Execution Phase)

To execute this architectural shift, the following step-by-step implementation plan should be followed:

### Step 1: Infrastructure Setup (`docker-compose.yml`)
* [x] Add **Redis** container (`redis:alpine`).
* [x] Add **MinIO** container (`minio/minio`) and expose API port `9000` and Console port `9001`.
* [x] Add a **Celery Worker** container (building from the backend `Dockerfile`, but overriding the command to start celery: `celery -A worker app worker --loglevel=info`).

### Step 2: MinIO & Encryption Integration (Backend)
* [x] Install required packages in `requirements.txt`: `boto3`, `cryptography`.
* [x] Create a `storage.py` utility to handle AES-256 GCM encryption.
* [x] Create S3 wrapper functions (`upload_to_minio`, `download_from_minio`) using the specific `endpoint_url` and `forcePathStyle` settings.

### Step 3: Celery Broker & Task Definition
* [x] Install `celery` and `redis`.
* [x] Initialize the Celery application in `backend/worker.py` pointing to the Redis broker URL (`redis://redis:6379/0`).
* [x] Move the `process_and_store_document` logic out of the synchronous `/api/documents` route and into a `@celery.task` decorator.

### Step 4: Local Embedding Switch
* [x] Install `sentence-transformers` and `torch`.
* [x] Refactor the vector generation inside the Celery task to use `all-MiniLM-L6-v2` instead of the `openai` client.
* [x] Update the Qdrant connection payload to match the new vector size (`384` for all-MiniLM-L6-v2, rather than OpenAI's `1536`).

### Step 5: Database & API Refactoring
* [x] Update the PostgreSQL `documents` schema to include `status` (`pending`, `processing`, `completed`, `failed`) and `s3_url`.
* [x] Modify `/api/documents` to simply encrypt, upload to MinIO, save the DB record, dispatch the Celery task (`task.delay(doc_id)`), and return immediately.

### Step 6: Frontend Status Polling
* [x] Update the Next.js `KnowledgeBasePage` upload flow.
* [x] Instead of waiting for the upload request to finish completely, the UI should show a "Processing in Background" state and occasionally poll a new `/api/documents/status` route to check if the Celery task has finished.
