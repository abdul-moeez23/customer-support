from pydantic import BaseModel, EmailStr
from datetime import datetime

# --- Company Schemas ---
class CompanyBase(BaseModel):
    name: str

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    company_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Auth / Signup Schema ---
class SignupRequest(BaseModel):
    company_name: str
    email: EmailStr
    password: str

# --- Connection Schemas ---
class DBConnectionCreate(BaseModel):
    company_id: str
    name: str
    db_type: str
    host: str
    port: str
    username: str
    password: str
    database_name: str

class DBConnectionResponse(BaseModel):
    id: str
    name: str
    db_type: str
    host: str
    database_name: str
    
    class Config:
        from_attributes = True

class AllowedTableCreate(BaseModel):
    connection_id: str
    tables: list[str]

class APIConnectionCreate(BaseModel):
    company_id: str
    name: str
    base_url: str
    auth_type: str
    api_key: str

class APIConnectionResponse(BaseModel):
    id: str
    name: str
    base_url: str
    auth_type: str
    
    class Config:
        from_attributes = True

class AllowedEndpointBase(BaseModel):
    path: str
    method: str
    description: str

class AllowedEndpointCreate(BaseModel):
    connection_id: str
    endpoints: list[AllowedEndpointBase]


# --- AI Engine / Chat Schemas ---
class ChatRequest(BaseModel):
    company_id: str
    message: str
    # Optional: override the provider for this request
    provider: str | None = None
    model: str | None = None


class ChatResponse(BaseModel):
    answer: str
    strategy: str
    escalated: bool
    tools_used: list[str]


# --- LLM Config Schemas ---
class LLMConfigUpdate(BaseModel):
    company_id: str
    name: str = "Default"
    provider: str   # "openai" | "anthropic" | "gemini"
    api_key: str | None = None # plain text from frontend, encrypted before saving


class LLMConfigResponse(BaseModel):
    id: str
    company_id: str
    name: str
    provider: str
    has_api_key: bool = False

    class Config:
        from_attributes = True


# --- Widget Config Schemas ---
class WidgetConfigCreate(BaseModel):
    company_id: str
    name: str = "Default Widget"
    bot_name: str = "Support Assistant"
    greeting_message: str = "👋 Hi! How can I help you today?"
    placeholder_text: str = "Type your message..."
    primary_color: str = "#2563eb"
    text_color: str = "#ffffff"
    bg_color: str = "#ffffff"
    user_bubble_color: str = "#2563eb"
    bot_bubble_color: str = "#f3f4f6"
    position: str = "bottom-right"
    show_branding: bool = True
    allow_attachments: bool = False
    llm_config_id: str | None = None
    llm_model: str | None = None

class WidgetConfigUpdate(BaseModel):
    name: str | None = None
    bot_name: str | None = None
    greeting_message: str | None = None
    placeholder_text: str | None = None
    primary_color: str | None = None
    text_color: str | None = None
    bg_color: str | None = None
    user_bubble_color: str | None = None
    bot_bubble_color: str | None = None
    position: str | None = None
    show_branding: bool | None = None
    allow_attachments: bool | None = None
    llm_config_id: str | None = None
    llm_model: str | None = None

class WidgetConfigResponse(BaseModel):
    id: str
    company_id: str
    widget_key: str
    name: str
    bot_name: str
    greeting_message: str
    placeholder_text: str
    primary_color: str
    text_color: str
    bg_color: str
    user_bubble_color: str
    bot_bubble_color: str
    position: str
    show_branding: bool
    allow_attachments: bool
    is_active: bool
    llm_config_id: str | None
    llm_model: str | None

    class Config:
        from_attributes = True


# Public widget schema (returned by widget_key — no company_id exposed)
class PublicWidgetConfigResponse(BaseModel):
    bot_name: str
    greeting_message: str
    placeholder_text: str
    primary_color: str
    text_color: str
    bg_color: str
    user_bubble_color: str
    bot_bubble_color: str
    position: str
    show_branding: bool
    allow_attachments: bool


# Widget chat (uses widget_key instead of company_id)
class WidgetChatRequest(BaseModel):
    widget_key: str
    message: str
    session_id: str | None = None  # for future conversation history


# --- Conversation / Inbox Schemas ---
class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    company_id: str
    session_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationWithMessagesResponse(ConversationResponse):
    messages: list[MessageResponse] = []


class AgentReplyRequest(BaseModel):
    content: str

class StatusUpdateRequest(BaseModel):
    status: str

class WidgetMappingUpdate(BaseModel):
    ids: list[str]

