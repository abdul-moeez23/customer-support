from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, get_db
import models, schemas
from auth import get_password_hash
from rag_pipeline import init_qdrant
from worker import process_document_task
from storage import upload_to_minio

# Create database tables (now managed by Alembic)
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Customer Support Platform API", version="1.0.0")

@app.on_event("startup")
def on_startup():
    # Initialize the vector database collection when the API starts
    try:
        init_qdrant()
    except Exception as e:
        print(f"Warning: Could not initialize Qdrant. Check credentials. {e}")

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    # Force reload 2
    return {"status": "healthy"}

@app.get("/api/init-db")
def init_db():
    import subprocess
    from database import engine
    from sqlalchemy import text
    with engine.connect() as con:
        con.execute(text("DROP TABLE IF EXISTS alembic_version;"))
        con.commit()
    result1 = subprocess.run(["alembic", "revision", "--autogenerate", "-m", "init"], capture_output=True, text=True)
    result2 = subprocess.run(["alembic", "upgrade", "head"], capture_output=True, text=True)
    return {"rev": result1.stdout + result1.stderr, "upg": result2.stdout + result2.stderr}

@app.get("/api/patch-deps")
def patch_deps():
    import subprocess
    result = subprocess.run(["pip", "install", "bcrypt==3.2.2"], capture_output=True, text=True)
    return {"out": result.stdout + result.stderr}

@app.post("/api/signup", response_model=schemas.UserResponse)
def signup(request: schemas.SignupRequest, db: Session = Depends(get_db)):
    try:
        existing_user = db.query(models.User).filter(models.User.email == request.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
            
        new_company = models.Company(name=request.company_name)
        db.add(new_company)
        db.flush() 
        
        hashed_password = get_password_hash(request.password)
        new_user = models.User(
            email=request.email,
            hashed_password=hashed_password,
            company_id=new_company.id
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return new_user
    except Exception as e:
        import traceback
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": str(e), "traceback": traceback.format_exc()})

from auth import verify_password

class LoginRequest(schemas.BaseModel):
    email: str
    password: str

@app.post("/api/login", response_model=schemas.UserResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return user

@app.get("/api/companies/{company_id}", response_model=schemas.CompanyResponse)
def get_company(company_id: str, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@app.post("/api/documents")
async def upload_document(
    company_id: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # Verify the company exists
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
         raise HTTPException(status_code=404, detail="Company not found")
         
    try:
        file_bytes = await file.read()
        
        # Create DB record in 'pending' state
        new_doc = models.Document(
            company_id=company_id,
            filename=file.filename,
            status='pending'
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        
        # Upload encrypted file to MinIO
        object_key = upload_to_minio(new_doc.id, file_bytes)
        
        # Update DB record with MinIO URL/key and set to 'processing'
        new_doc.s3_url = object_key
        new_doc.status = 'processing'
        db.commit()
        
        # Queue the Celery task
        process_document_task.delay(object_key, file.filename, company_id)
        
        # Return 202 Accepted immediately
        return {
            "status": "processing", 
            "filename": file.filename,
            "document_id": new_doc.id,
            "message": "Document uploaded securely and queued for processing."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{document_id}/status")
def get_document_status(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "status": doc.status,
        "filename": doc.filename
    }

# Phase 9: Document Management endpoints
@app.get("/api/documents/company/{company_id}")
def get_company_documents(company_id: str, db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(models.Document.company_id == company_id).all()
    results = []
    for doc in docs:
        mappings = db.query(models.WidgetDocumentAccess).filter(models.WidgetDocumentAccess.document_id == doc.id).all()
        results.append({
            "id": doc.id,
            "filename": doc.filename,
            "status": doc.status,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "widget_ids": [m.widget_id for m in mappings]
        })
    return results

@app.put("/api/documents/{document_id}/widgets")
def update_document_widgets(document_id: str, payload: dict, db: Session = Depends(get_db)):
    widget_ids = payload.get("widget_ids", [])
    db.query(models.WidgetDocumentAccess).filter(models.WidgetDocumentAccess.document_id == document_id).delete()
    for w_id in widget_ids:
        acc = models.WidgetDocumentAccess(widget_id=w_id, document_id=document_id)
        db.add(acc)
    db.commit()
    return {"status": "success"}

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete from Qdrant
    try:
        from rag_pipeline import delete_document_from_qdrant
        delete_document_from_qdrant(document_id)
    except Exception as e:
        print(f"Error deleting from Qdrant: {e}")
        
    # Delete mappings
    db.query(models.WidgetDocumentAccess).filter(models.WidgetDocumentAccess.document_id == document_id).delete()
    
    # Delete from DB
    db.delete(doc)
    db.commit()
    
    return {"status": "success"}

from pydantic import BaseModel
class RAGQuery(BaseModel):
    company_id: str
    query: str

@app.post("/api/rag/search")
def search_knowledge_base(request: RAGQuery, db: Session = Depends(get_db)):
    """API endpoint to securely search a company's isolated knowledge base."""
    company = db.query(models.Company).filter(models.Company.id == request.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    try:
        from rag_pipeline import query_documents
        results = query_documents(request.query, request.company_id)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from encryption import encrypt, decrypt
from connectors import test_db_connection_and_get_tables

@app.post("/api/connections/database", response_model=schemas.DBConnectionResponse)
def create_database_connection(request: schemas.DBConnectionCreate, db: Session = Depends(get_db)):
    # 1. Test the connection first before saving
    try:
        tables = test_db_connection_and_get_tables(
            request.db_type, request.host, request.port, 
            request.username, request.password, request.database_name
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Database connection failed: {str(e)}")
        
    # 2. Encrypt password
    enc_password = encrypt(request.password)
    
    # 3. Save to DB
    new_conn = models.DatabaseConnection(
        company_id=request.company_id,
        name=request.name,
        db_type=request.db_type,
        host=request.host,
        port=request.port,
        username=request.username,
        encrypted_password=enc_password,
        database_name=request.database_name
    )
    db.add(new_conn)
    db.commit()
    db.refresh(new_conn)
    
    return new_conn

@app.get("/api/connections/database/{connection_id}/schema")
def get_database_schema(connection_id: str, db: Session = Depends(get_db)):
    conn = db.query(models.DatabaseConnection).filter(models.DatabaseConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    dec_password = decrypt(conn.encrypted_password)
    try:
        tables = test_db_connection_and_get_tables(
            conn.db_type, conn.host, conn.port, 
            conn.username, dec_password, conn.database_name
        )
        return {"tables": tables}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/connections/database/allowed-tables")
def save_allowed_tables(request: schemas.AllowedTableCreate, db: Session = Depends(get_db)):
    # Clear existing policies for this connection
    db.query(models.AllowedTable).filter(models.AllowedTable.connection_id == request.connection_id).delete()
    
    # Save new policies
    for table in request.tables:
        new_table = models.AllowedTable(
            connection_id=request.connection_id,
            table_name=table
        )
        db.add(new_table)
    db.commit()
    return {"status": "success"}

# Phase 10: Database Connection Management endpoints
@app.get("/api/connections/database/company/{company_id}")
def get_company_database_connections(company_id: str, db: Session = Depends(get_db)):
    conns = db.query(models.DatabaseConnection).filter(models.DatabaseConnection.company_id == company_id).all()
    results = []
    for conn in conns:
        results.append({
            "id": conn.id,
            "name": conn.name,
            "db_type": conn.db_type,
            "host": conn.host,
            "port": conn.port,
            "database_name": conn.database_name
        })
    return results

@app.get("/api/connections/database/{connection_id}/widgets")
def get_connection_widget_mappings(connection_id: str, db: Session = Depends(get_db)):
    # Returns which widgets have access to which tables for this connection
    allowed_tables = db.query(models.AllowedTable).filter(models.AllowedTable.connection_id == connection_id).all()
    
    results = []
    for at in allowed_tables:
        mappings = db.query(models.WidgetTableAccess).filter(models.WidgetTableAccess.allowed_table_id == at.id).all()
        results.append({
            "table_name": at.table_name,
            "widget_ids": [m.widget_id for m in mappings]
        })
    return results

@app.delete("/api/connections/database/{connection_id}")
def delete_database_connection(connection_id: str, db: Session = Depends(get_db)):
    conn = db.query(models.DatabaseConnection).filter(models.DatabaseConnection.id == connection_id).first()
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
        
    # Delete related WidgetTableAccess
    allowed_tables = db.query(models.AllowedTable).filter(models.AllowedTable.connection_id == connection_id).all()
    allowed_table_ids = [at.id for at in allowed_tables]
    if allowed_table_ids:
        db.query(models.WidgetTableAccess).filter(models.WidgetTableAccess.allowed_table_id.in_(allowed_table_ids)).delete(synchronize_session=False)
        
    # Delete AllowedTables
    db.query(models.AllowedTable).filter(models.AllowedTable.connection_id == connection_id).delete()
    
    # Delete the Connection
    db.delete(conn)
    db.commit()
    return {"status": "success"}

@app.post("/api/connections/api", response_model=schemas.APIConnectionResponse)
def create_api_connection(request: schemas.APIConnectionCreate, db: Session = Depends(get_db)):
    enc_api_key = encrypt(request.api_key)
    new_conn = models.APIConnection(
        company_id=request.company_id,
        name=request.name,
        base_url=request.base_url,
        auth_type=request.auth_type,
        encrypted_api_key=enc_api_key
    )
    db.add(new_conn)
    db.commit()
    db.refresh(new_conn)
    return new_conn

@app.post("/api/connections/api/allowed-endpoints")
def save_allowed_endpoints(request: schemas.AllowedEndpointCreate, db: Session = Depends(get_db)):
    db.query(models.AllowedEndpoint).filter(models.AllowedEndpoint.connection_id == request.connection_id).delete()
    for ep in request.endpoints:
        db.add(models.AllowedEndpoint(
            connection_id=request.connection_id,
            path=ep.path,
            method=ep.method,
            description=ep.description
        ))
    db.commit()
    return {"status": "success", "message": "Access policy saved"}


# =============================================================================
# Phase 5: AI Engine & Query Router
# =============================================================================

from ai_engine.engine import run_ai_engine, EngineConfig
from ai_engine.llm_providers import get_available_providers

VALID_PROVIDERS = {"openai", "anthropic", "gemini"}


@app.post("/api/chat", response_model=schemas.ChatResponse)
def chat_with_ai(request: schemas.ChatRequest, db: Session = Depends(get_db)):
    """
    Main AI chat endpoint. Accepts a customer message and runs it through
    the full AI Engine pipeline:
      1. MCP tool discovery (live DB access)
      2. Query routing (rag / mcp / rag+mcp / escalate / direct)
      3. RAG retrieval (if needed)
      4. MCP execution (if needed)
      5. Final answer synthesis via LLM

    The company's saved LLM provider/model is used unless overridden in the request.
    """
    # Verify company exists
    company = db.query(models.Company).filter(models.Company.id == request.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Load company's LLM config (fallback to openai if not configured)
    llm_config = (
        db.query(models.LLMConfig)
        .filter(models.LLMConfig.company_id == request.company_id)
        .first()
    )

    # Request-level overrides take precedence over saved config
    provider = request.provider or (llm_config.provider if llm_config else "openai")
    model = request.model or (llm_config.model if llm_config else None)

    if provider not in VALID_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider '{provider}'. Choose from: {list(VALID_PROVIDERS)}"
        )

    api_key = None
    if llm_config and llm_config.encrypted_api_key:
        from encryption import decrypt
        api_key = decrypt(llm_config.encrypted_api_key)

    config = EngineConfig(provider=provider, answer_model=model, router_model=model, api_key=api_key)

    try:
        result = run_ai_engine(
            message=request.message,
            company_id=request.company_id,
            company_name=company.name,
            config=config,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine error: {str(e)}")

    return schemas.ChatResponse(
        answer=result.answer,
        strategy=result.strategy,
        escalated=result.escalated,
        tools_used=result.tools_used,
    )


@app.get("/api/llm-config/{company_id}", response_model=schemas.LLMConfigResponse)
def get_llm_config(company_id: str, db: Session = Depends(get_db)):
    """Fetch the saved LLM provider configuration for a company."""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    config = (
        db.query(models.LLMConfig)
        .filter(models.LLMConfig.company_id == company_id)
        .first()
    )

    if not config:
        # Return default if not configured yet
        return schemas.LLMConfigResponse(company_id=company_id, provider="openai", model=None, has_api_key=False)

    return schemas.LLMConfigResponse(
        company_id=company_id, 
        provider=config.provider, 
        model=config.model, 
        has_api_key=bool(config.encrypted_api_key)
    )


@app.post("/api/llm-config", response_model=schemas.LLMConfigResponse)
def save_llm_config(request: schemas.LLMConfigUpdate, db: Session = Depends(get_db)):
    """Save or update the LLM provider configuration for a company."""
    company = db.query(models.Company).filter(models.Company.id == request.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if request.provider not in VALID_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider. Choose from: {list(VALID_PROVIDERS)}"
        )

    config = (
        db.query(models.LLMConfig)
        .filter(models.LLMConfig.company_id == request.company_id)
        .first()
    )

    enc_api_key = None
    if request.api_key:
        from encryption import encrypt
        enc_api_key = encrypt(request.api_key)

    if config:
        config.provider = request.provider
        config.model = request.model
        if enc_api_key:
            config.encrypted_api_key = enc_api_key
    else:
        config = models.LLMConfig(
            company_id=request.company_id,
            provider=request.provider,
            model=request.model,
            encrypted_api_key=enc_api_key
        )
        db.add(config)

    db.commit()
    db.refresh(config)
    return schemas.LLMConfigResponse(
        company_id=config.company_id, 
        provider=config.provider, 
        model=config.model, 
        has_api_key=bool(config.encrypted_api_key)
    )


@app.get("/api/ai/providers")
def list_ai_providers():
    """List all supported LLM providers and their default models."""
    return {"providers": get_available_providers()}


# =============================================================================
# Phase 6: Widget Config & Public Widget Endpoints
# =============================================================================

def _default_widget_config(company_id: str) -> schemas.WidgetConfigResponse:
    """Return default widget config when none is saved."""
    return schemas.WidgetConfigResponse(
        company_id=company_id,
        bot_name="Support Assistant",
        greeting_message="👋 Hi! How can I help you today?",
        placeholder_text="Type your message...",
        primary_color="#2563eb",
        text_color="#ffffff",
        bg_color="#ffffff",
        user_bubble_color="#2563eb",
        bot_bubble_color="#f3f4f6",
        position="bottom-right",
        show_branding=True,
        allow_attachments=False,
    )


@app.get("/api/widget-config/{company_id}", response_model=list[schemas.WidgetConfigResponse])
def get_widget_configs(company_id: str, include_archived: bool = False, db: Session = Depends(get_db)):
    """Fetch all widget configurations for a company."""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    query = db.query(models.WidgetConfig).filter(models.WidgetConfig.company_id == company_id)
    if not include_archived:
        query = query.filter(models.WidgetConfig.is_active == True)
        
    configs = query.all()
    
    if not configs:
        # Create a default one if none exist
        default_config = models.WidgetConfig(
            company_id=company_id,
            bot_name="Support Assistant",
            greeting_message="👋 Hi! How can I help you today?",
            placeholder_text="Type your message...",
            primary_color="#2563eb",
            text_color="#ffffff",
            bg_color="#ffffff",
            user_bubble_color="#2563eb",
            bot_bubble_color="#f3f4f6",
            position="bottom-right",
            show_branding=True,
            allow_attachments=False
        )
        db.add(default_config)
        db.commit()
        db.refresh(default_config)
        configs = [default_config]

    return configs

@app.post("/api/widget-config/create", response_model=schemas.WidgetConfigResponse)
def create_widget_config(request: schemas.WidgetConfigCreate, db: Session = Depends(get_db)):
    """Create a new widget configuration for a company."""
    company = db.query(models.Company).filter(models.Company.id == request.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    new_config = models.WidgetConfig(**request.model_dump())
    db.add(new_config)
    db.commit()
    db.refresh(new_config)
    return new_config

@app.put("/api/widget-config/{widget_id}", response_model=schemas.WidgetConfigResponse)
def update_widget_config(widget_id: str, request: schemas.WidgetConfigUpdate, db: Session = Depends(get_db)):
    """Update an existing widget configuration."""
    config = db.query(models.WidgetConfig).filter(models.WidgetConfig.id == widget_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Widget not found")

    fields = request.model_dump(exclude_unset=True)
    for key, val in fields.items():
        setattr(config, key, val)
        
    db.commit()
    db.refresh(config)
    return config

@app.put("/api/widget-config/{widget_id}/archive")
def archive_widget_config(widget_id: str, active: bool = False, db: Session = Depends(get_db)):
    """Archive or unarchive a widget configuration."""
    config = db.query(models.WidgetConfig).filter(models.WidgetConfig.id == widget_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Widget not found")
        
    config.is_active = active
    db.commit()
    return {"status": "success", "is_active": active}

from pydantic import BaseModel
class WidgetTableMapRequest(BaseModel):
    connection_id: str
    tables: list[str]

@app.post("/api/widget-config/{widget_id}/tables")
def map_widget_tables(widget_id: str, request: WidgetTableMapRequest, db: Session = Depends(get_db)):
    """Map allowed tables to a specific widget."""
    config = db.query(models.WidgetConfig).filter(models.WidgetConfig.id == widget_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Widget not found")
        
    # Clear existing mappings for this connection/widget combo
    # We must find the allowed tables for this connection first to delete them
    allowed_tables = db.query(models.AllowedTable).filter(
        models.AllowedTable.connection_id == request.connection_id
    ).all()
    allowed_table_ids = [at.id for at in allowed_tables]
    
    if allowed_table_ids:
        db.query(models.WidgetTableAccess).filter(
            models.WidgetTableAccess.widget_id == widget_id,
            models.WidgetTableAccess.allowed_table_id.in_(allowed_table_ids)
        ).delete(synchronize_session=False)
    
    # Add new mappings
    for table_name in request.tables:
        allowed_table = db.query(models.AllowedTable).filter(
            models.AllowedTable.connection_id == request.connection_id,
            models.AllowedTable.table_name == table_name
        ).first()
        
        if allowed_table:
            mapping = models.WidgetTableAccess(
                widget_id=widget_id,
                allowed_table_id=allowed_table.id
            )
            db.add(mapping)
        
    db.commit()
    return {"status": "success"}

class WidgetDocumentMapRequest(BaseModel):
    document_id: str

@app.post("/api/widget-config/{widget_id}/documents")
def map_widget_document(widget_id: str, request: WidgetDocumentMapRequest, db: Session = Depends(get_db)):
    """Map a document to a specific widget."""
    config = db.query(models.WidgetConfig).filter(models.WidgetConfig.id == widget_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Widget not found")
        
    # Check if exists
    existing = db.query(models.WidgetDocumentAccess).filter(
        models.WidgetDocumentAccess.widget_id == widget_id,
        models.WidgetDocumentAccess.document_id == request.document_id
    ).first()
    
    if not existing:
        mapping = models.WidgetDocumentAccess(
            widget_id=widget_id,
            document_id=request.document_id
        )
        db.add(mapping)
        db.commit()
        
    return {"status": "success"}



# ── Public endpoints (used by the embeddable widget, no auth required) ───────

@app.get("/api/public/widget-config/{widget_key}", response_model=schemas.PublicWidgetConfigResponse)
def get_public_widget_config(widget_key: str, db: Session = Depends(get_db)):
    """
    Public endpoint called by the embeddable widget on load.
    Uses widget_key (not company_id) so the company_id stays server-side.
    """
    config = db.query(models.WidgetConfig).filter(
        models.WidgetConfig.widget_key == widget_key
    ).first()

    if not config:
        # Return defaults
        return schemas.PublicWidgetConfigResponse(
            bot_name="Support Assistant",
            greeting_message="👋 Hi! How can I help you today?",
            placeholder_text="Type your message...",
            primary_color="#2563eb",
            text_color="#ffffff",
            bg_color="#ffffff",
            user_bubble_color="#2563eb",
            bot_bubble_color="#f3f4f6",
            position="bottom-right",
            show_branding=True,
            allow_attachments=False,
        )

    return schemas.PublicWidgetConfigResponse(
        bot_name=config.bot_name,
        greeting_message=config.greeting_message,
        placeholder_text=config.placeholder_text,
        primary_color=config.primary_color,
        text_color=config.text_color,
        bg_color=config.bg_color,
        user_bubble_color=config.user_bubble_color,
        bot_bubble_color=config.bot_bubble_color,
        position=config.position,
        show_branding=config.show_branding,
        allow_attachments=config.allow_attachments,
    )


@app.get("/api/public/chat/{widget_key}/{session_id}")
def get_widget_chat_history(widget_key: str, session_id: str, db: Session = Depends(get_db)):
    config = db.query(models.WidgetConfig).filter(
        models.WidgetConfig.widget_key == widget_key
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Invalid widget key")
        
    company = db.query(models.Company).filter(models.Company.id == config.company_id).first()

    conversation = db.query(models.Conversation).filter(
        models.Conversation.session_id == session_id,
        models.Conversation.company_id == company.id
    ).first()

    if not conversation:
        return {"messages": []}

    return {
        "status": conversation.status,
        "messages": [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at} for m in conversation.messages]
    }

@app.post("/api/public/chat", response_model=schemas.ChatResponse)
def widget_chat(request: schemas.WidgetChatRequest, db: Session = Depends(get_db)):
    """
    Public chat endpoint for the embeddable widget.
    Authenticates via widget_key (public), resolves the company, then
    runs the full AI Engine pipeline on their behalf.
    """
    config = db.query(models.WidgetConfig).filter(
        models.WidgetConfig.widget_key == request.widget_key
    ).first()
    if not config:
        raise HTTPException(status_code=404, detail="Invalid widget key")
        
    company = db.query(models.Company).filter(models.Company.id == config.company_id).first()

    session_id = request.session_id or "default-session"

    # Fetch or create conversation
    conversation = db.query(models.Conversation).filter(
        models.Conversation.session_id == session_id,
        models.Conversation.company_id == company.id
    ).first()

    if not conversation:
        conversation = models.Conversation(
            company_id=company.id,
            session_id=session_id,
            status="active"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save user message
    user_msg = models.Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message
    )
    db.add(user_msg)

    # Load company LLM config
    llm_config = db.query(models.LLMConfig).filter(
        models.LLMConfig.company_id == company.id
    ).first()

    provider = llm_config.provider if llm_config else "openai"
    model = llm_config.model if llm_config else None
    
    api_key = None
    if llm_config and llm_config.encrypted_api_key:
        from encryption import decrypt
        api_key = decrypt(llm_config.encrypted_api_key)

    engine_config = EngineConfig(provider=provider, answer_model=model, router_model=model, api_key=api_key)

    try:
        result = run_ai_engine(
            message=request.message,
            company_id=company.id,
            company_name=company.name,
            config=engine_config,
            widget_purpose=config.purpose
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Engine error: {str(e)}")

    # Save bot message
    bot_msg = models.Message(
        conversation_id=conversation.id,
        role="bot",
        content=result.answer
    )
    db.add(bot_msg)

    if result.escalated:
        conversation.status = "escalated"
    
    db.commit()

    return schemas.ChatResponse(
        answer=result.answer,
        strategy=result.strategy,
        escalated=result.escalated,
        tools_used=result.tools_used,
    )

# =============================================================================
# Phase 7: Inbox & Escalation Management
# =============================================================================

@app.get("/api/conversations", response_model=list[schemas.ConversationResponse])
def get_conversations(company_id: str, status: str = None, db: Session = Depends(get_db)):
    """Fetch conversations for a company, optionally filtered by status."""
    query = db.query(models.Conversation).filter(models.Conversation.company_id == company_id)
    if status:
        query = query.filter(models.Conversation.status == status)
    
    return query.order_by(models.Conversation.updated_at.desc()).all()


@app.get("/api/conversations/{conversation_id}", response_model=schemas.ConversationWithMessagesResponse)
def get_conversation_details(conversation_id: str, db: Session = Depends(get_db)):
    """Fetch a conversation and its full message history."""
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@app.post("/api/conversations/{conversation_id}/reply", response_model=schemas.MessageResponse)
def agent_reply(conversation_id: str, request: schemas.AgentReplyRequest, db: Session = Depends(get_db)):
    """Add a human agent reply and mark conversation as active/resolved (no longer escalated)."""
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    agent_msg = models.Message(
        conversation_id=conv.id,
        role="agent",
        content=request.content
    )
    db.add(agent_msg)
    
    # If it was escalated, agent reply means it's now active (being handled)
    if conv.status == "escalated":
        conv.status = "active"
        
    db.commit()
    db.refresh(agent_msg)
    return agent_msg


@app.patch("/api/conversations/{conversation_id}/status")
def update_conversation_status(conversation_id: str, request: schemas.StatusUpdateRequest, db: Session = Depends(get_db)):
    """Update conversation status (e.g. to 'resolved')."""
    conv = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if request.status not in ["active", "escalated", "resolved"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    conv.status = request.status
    db.commit()
    return {"status": "success"}
