import os
import tempfile
import uuid
from typing import List

from qdrant_client import QdrantClient
from qdrant_client.http import models
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader

from sentence_transformers import SentenceTransformer

# Initialize clients using the .env variables
qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL", "http://qdrant:6333"),
    api_key=os.getenv("QDRANT_API_KEY"),
)
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

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
                size=384, # Dimension for all-MiniLM-L6-v2
                distance=models.Distance.COSINE
            )
        )

def process_and_store_document(file_bytes: bytes, filename: str, company_id: str, document_id: str):
    """Extracts text, chunks it, embeds it, and stores it securely tagged with company_id and document_id."""
    
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

    # 3. Generate embeddings using SentenceTransformer
    embeddings = embedding_model.encode(chunks).tolist()
    
    # 4. Store in Qdrant with STRICT multi-tenant metadata tagging
    points = []
    for chunk, embedding in zip(chunks, embeddings):
        point_id = str(uuid.uuid4()) # Unique ID for each chunk
        points.append(
            models.PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "company_id": company_id, # CRITICAL: This isolates the data!
                    "document_id": document_id,
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

def delete_document_from_qdrant(document_id: str):
    """Deletes all chunks associated with a document_id from Qdrant."""
    qdrant.delete(
        collection_name=COLLECTION_NAME,
        points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="document_id",
                        match=models.MatchValue(value=document_id),
                    ),
                ],
            )
        )
    )

def query_documents(query_text: str, company_id: str, limit: int = 5, widget_key: str = None):
    """Searches Qdrant for relevant chunks, strictly isolated by company_id and optionally widget_key."""
    # 1. Embed the search query locally
    query_vector = embedding_model.encode([query_text]).tolist()[0]

    # 2. Search Qdrant securely with a Must Match Filter
    must_conditions = [
        models.FieldCondition(
            key="company_id",
            match=models.MatchValue(value=company_id)
        )
    ]
    
    # If a widget_key is provided, we only want documents allowed for this widget
    # We would check the WidgetDocumentAccess table, find allowed doc_ids, and add a condition here.
    # For now, to implement this securely:
    if widget_key:
        from database import SessionLocal
        import models as db_models
        db = SessionLocal()
        try:
            widget = db.query(db_models.WidgetConfig).filter(db_models.WidgetConfig.widget_key == widget_key).first()
            if widget:
                mappings = db.query(db_models.WidgetDocumentAccess).filter(db_models.WidgetDocumentAccess.widget_id == widget.id).all()
                allowed_doc_ids = [m.document_id for m in mappings]
                if allowed_doc_ids:
                    must_conditions.append(
                        models.FieldCondition(
                            key="document_id",
                            match=models.MatchAny(any=allowed_doc_ids)
                        )
                    )
                else:
                    # If no docs allowed, return empty
                    return []
        finally:
            db.close()

    search_results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_vector,
        query_filter=models.Filter(must=must_conditions),
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
