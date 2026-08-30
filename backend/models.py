import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    filename = Column(String, nullable=False)
    s3_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default="pending") # pending, processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company")

class Company(Base):
    __tablename__ = "companies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="company")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    company_id = Column(String, ForeignKey("companies.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="users")

class DatabaseConnection(Base):
    __tablename__ = "database_connections"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    db_type = Column(String, nullable=False) # e.g., postgres, mysql
    host = Column(String, nullable=False)
    port = Column(String, nullable=False)
    username = Column(String, nullable=False)
    encrypted_password = Column(String, nullable=False) # NEVER STORE PLAIN TEXT
    database_name = Column(String, nullable=False)
    
    company = relationship("Company")

class AllowedTable(Base):
    __tablename__ = "allowed_tables"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    connection_id = Column(String, ForeignKey("database_connections.id"), nullable=False)
    table_name = Column(String, nullable=False)
    
    connection = relationship("DatabaseConnection")

class APIConnection(Base):
    __tablename__ = "api_connections"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    base_url = Column(String, nullable=False)
    auth_type = Column(String, nullable=False) # e.g. bearer, basic, header
    encrypted_api_key = Column(String, nullable=False)
    
    company = relationship("Company")

class AllowedEndpoint(Base):
    __tablename__ = "allowed_endpoints"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    connection_id = Column(String, ForeignKey("api_connections.id"), nullable=False)
    path = Column(String, nullable=False)
    method = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    connection = relationship("APIConnection")


class LLMConfig(Base):
    """Stores the LLM provider & model preference for each company."""
    __tablename__ = "llm_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), unique=True, nullable=False)
    # e.g. "openai", "anthropic", "gemini"
    provider = Column(String, nullable=False, default="openai")
    # e.g. "gpt-4o-mini", "claude-3-haiku-20240307", "gemini-1.5-flash"
    model = Column(String, nullable=True)
    encrypted_api_key = Column(String, nullable=True) # NEVER STORE PLAIN TEXT
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")


class WidgetConfig(Base):
    """Stores per-company widget appearance and behaviour customization."""
    __tablename__ = "widget_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # The widget_key is public and used by the frontend chat widget to identify this specific widget instance
    widget_key = Column(String, unique=True, index=True, nullable=False, default=generate_uuid)

    # Branding
    name = Column(String, nullable=False, default="Default Widget") # To help companies identify which script this is
    bot_name = Column(String, nullable=False, default="Support Assistant")
    
    # AI Behavior (Context / Separation)
    purpose = Column(String, nullable=True, default="General Customer Support") # e.g. "Order Support", "Help Center Docs Only"
    greeting_message = Column(String, nullable=False, default="👋 Hi! How can I help you today?")
    placeholder_text = Column(String, nullable=False, default="Type your message...")

    # Colors (hex values)
    primary_color = Column(String, nullable=False, default="#2563eb")   # bubble + header
    text_color = Column(String, nullable=False, default="#ffffff")       # text on primary bg
    bg_color = Column(String, nullable=False, default="#ffffff")         # chat window bg
    user_bubble_color = Column(String, nullable=False, default="#2563eb")
    bot_bubble_color = Column(String, nullable=False, default="#f3f4f6")

    # Layout
    position = Column(String, nullable=False, default="bottom-right")   # or "bottom-left"

    # Features
    show_branding = Column(Boolean, nullable=False, default=True)        # "Powered by AI Support"
    allow_attachments = Column(Boolean, nullable=False, default=False)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")


class Conversation(Base):
    """Stores a chat session between a user and the AI (or human agent)."""
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    session_id = Column(String, index=True, nullable=False)
    status = Column(String, nullable=False, default="active") # "active", "escalated", "resolved"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    """Stores individual messages in a conversation."""
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False) # "user", "bot", "agent"
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class WidgetTableAccess(Base):
    __tablename__ = 'widget_table_access'

    id = Column(String, primary_key=True, default=generate_uuid)
    widget_id = Column(String, ForeignKey('widget_configs.id'), nullable=False)
    allowed_table_id = Column(String, ForeignKey('allowed_tables.id'), nullable=False)

    widget = relationship('WidgetConfig')
    allowed_table = relationship('AllowedTable')

class WidgetDocumentAccess(Base):
    __tablename__ = 'widget_document_access'

    id = Column(String, primary_key=True, default=generate_uuid)
    widget_id = Column(String, ForeignKey('widget_configs.id'), nullable=False)
    document_id = Column(String, ForeignKey('documents.id'), nullable=False)

    widget = relationship('WidgetConfig')
    document = relationship('Document')

