import os
import tempfile
import uuid
from typing import List
from openai import OpenAI
from qdrant_client import QdrantClient
from qdrant_client.http import models
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

# Initialize clients using the .env variables
# (Ensure QDRANT_URL, QDRANT_API_KEY, and OPENAI_API_KEY are set in your .env)
qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

COLLECTION_NAME = "company_documents"

def init_qdrant():
    """Ensure the Qdrant collection exists."""
    try:
        qdrant.get_collection(COLLECTION_NAME)
    except Exception:
        # Create it if it doesn't exist
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=1536, # Dimension for OpenAI text-embedding-3-small
                distance=models.Distance.COSINE
            )
        )

def process_and_store_document(file_bytes: bytes, filename: str, company_id: str):
    """Extracts text, chunks it, embeds it, and stores it securely tagged with company_id."""
    
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

    # 3. Generate embeddings using OpenAI
    response = openai_client.embeddings.create(
        input=chunks,
        model="text-embedding-3-small"
    )
    
    # 4. Store in Qdrant with STRICT multi-tenant metadata tagging
    points = []
    for chunk, embedding_data in zip(chunks, response.data):
        point_id = str(uuid.uuid4()) # Unique ID for each chunk
        points.append(
            models.PointStruct(
                id=point_id,
                vector=embedding_data.embedding,
                payload={
                    "company_id": company_id, # CRITICAL: This isolates the data!
                    "filename": filename,
                    "text": chunk
                }
            )
        )
        
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )
    
    return len(chunks)

def query_documents(query_text: str, company_id: str, limit: int = 5):
    """Searches Qdrant for relevant chunks, strictly isolated by company_id."""
    # 1. Embed the search query
    response = openai_client.embeddings.create(
        input=query_text,
        model="text-embedding-3-small"
    )
    query_vector = response.data[0].embedding

    # 2. Search Qdrant securely with a Must Match Filter for company_id
    search_results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="company_id",
                    match=models.MatchValue(value=company_id)
                )
            ]
        ),
        limit=limit
    )

    # 3. Format results
    results = []
    for hit in search_results:
        results.append({
            "score": hit.score,
            "text": hit.payload.get("text", ""),
            "filename": hit.payload.get("filename", "")
        })

    return results
