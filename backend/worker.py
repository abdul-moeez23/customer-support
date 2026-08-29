import os
import tempfile
import uuid
from celery import Celery
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader
from storage import download_from_minio
from sentence_transformers import SentenceTransformer
from database import SessionLocal
import models

celery_app = Celery(
    "worker",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
)

qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL", "http://qdrant:6333"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

# Load the model once in the Celery worker memory
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

COLLECTION_NAME = "company_documents"

@celery_app.task
def process_document_task(object_key: str, filename: str, company_id: str):
    """Downloads from MinIO, extracts text, chunks, embeds, and stores securely in Qdrant."""
    
    db = SessionLocal()
    # Find the document by s3_url (object_key)
    doc = db.query(models.Document).filter(models.Document.s3_url == object_key).first()
    
    try:
        # Download and decrypt file bytes from MinIO
        file_bytes = download_from_minio(object_key)
        
        # 1. Extract text based on file type
        text = ""
        if filename.lower().endswith(".pdf"):
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
            
            try:
                reader = PdfReader(temp_path)
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
            finally:
                os.remove(temp_path)
        else:
            # Default to raw text decoding
            text = file_bytes.decode("utf-8")
            
        if not text.strip():
            raise ValueError("No text could be extracted from the document.")

        # 2. Chunk the text logically
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        chunks = text_splitter.split_text(text)
        
        if not chunks:
            raise ValueError("Document is empty after chunking.")

        # 3. Generate embeddings locally
        embeddings = embedding_model.encode(chunks).tolist()
        
        # 4. Store in Qdrant with STRICT multi-tenant metadata tagging
        points = []
        for chunk, embedding_vector in zip(chunks, embeddings):
            point_id = str(uuid.uuid4()) # Unique ID for each chunk
            points.append(
                qdrant_models.PointStruct(
                    id=point_id,
                    vector=embedding_vector,
                    payload={
                        "company_id": company_id, 
                        "filename": filename,
                        "text": chunk
                    }
                )
            )
            
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        
        if doc:
            doc.status = 'completed'
            db.commit()
            
        return len(chunks)
        
    except Exception as e:
        if doc:
            doc.status = 'failed'
            db.commit()
        raise e
    finally:
        db.close()
