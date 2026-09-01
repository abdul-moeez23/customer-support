# AI Customer Support Platform - Implementation Plan

Based on the requirements and tech stack provided, here is the phased implementation plan for the multi-tenant AI Customer Support Platform. Use the checkboxes below to track progress.

## 📁 Project Folder Structure

```text
├── backend/          ← FastAPI + Python (Core backend, auth, database management, query router)
├── frontend/         ← Next.js + TypeScript (Company dashboard, configuration UI)
├── widget/           ← TypeScript (Standalone embeddable chat widget script)
├── mcp/              ← Python MCP (Model Context Protocol server for secure DB/API tool access)
├── rag/              ← Python (Document processing, chunking, embeddings, Qdrant integration)
├── requirement.txt   ← Project scenario requirements
└── TECH_STACK.md.txt ← Technology stack
```

---

## 🚀 Implementation Phases & Milestones

### [x] Phase 1: Foundation, Multi-tenancy & Docker Setup
**Goal:** Establish the core infrastructure, Docker environments, multi-tenant database schema, and authentication.
- [x] **Docker:** Create `docker-compose.yml` to orchestrate PostgreSQL, Qdrant, backend, and frontend services.
- [x] **Backend (`backend/`):** Set up FastAPI with Docker, configure PostgreSQL, implement multi-tenant database models (`Company`, `User`). Generate unique `company_id` and `widget_key` on signup.
- [x] **Frontend (`frontend/`):** Scaffold Next.js app with Docker, implement authentication (signup/login), and create the basic Company Dashboard layout.
- [x] **Milestone 1:** A company can sign up, log in, and view their dashboard with a unique `company_id` and `widget_key`, all running seamlessly in Docker.

### [x] Phase 2: Knowledge Base & RAG Pipeline
**Goal:** Allow companies to upload documents and query them securely.
- [x] **RAG (`rag/`):** Build the document processing pipeline (PDF, DOCX, TXT parsing, chunking). Integrate embeddings and store them in **Qdrant** with `company_id` metadata.
- [x] **Frontend (`frontend/`):** Build the Knowledge Base UI for document upload and management.
- [x] **Backend (`backend/`):** Create API endpoints for document uploads and basic RAG querying.
- [x] **Milestone 2:** Companies can upload documents, and the system can retrieve company-specific chunks based on search queries.

### [x] Phase 3: Database & API Connections (Secure Storage)
**Goal:** Enable companies to connect external databases and APIs safely.
- [x] **Backend (`backend/`):** Implement secure (encrypted) storage for DB credentials and API keys.
- [x] **Backend (`backend/`):** Build connectors to discover database schemas (tables/columns) and validate API connections.
- [x] **Frontend (`frontend/`):** Create the DB & API Connection UI. Allow companies to select and approve specific tables and API endpoints (Access Policies).
- [x] **Milestone 3:** Companies can connect an external DB/API and explicitly select which tables/endpoints the AI is allowed to access.

### [x] Phase 4: MCP Tool Layer
**Goal:** Provide secure, structured live data access to the AI using Model Context Protocol.
- [x] **MCP (`mcp/`):** Develop the MCP server that dynamically generates tools based on a company's Access Policies (e.g., `get_order_status`).
- [x] **MCP (`mcp/`):** Ensure the MCP server validates `company_id` and only queries approved tables/endpoints using the company's credentials.
- [x] **Milestone 4:** The MCP layer can securely execute a database query or API call using only approved tools, strictly isolated per company.

### [x] Phase 5: AI Engine & Query Router
**Goal:** Build the brain that orchestrates LLMs, RAG, and MCP.
- [x] **Backend (`backend/`):** Integrate OpenAI, Anthropic, and Google Gemini SDKs. Allow companies to select and configure their preferred LLM.
- [x] **Backend (`backend/`):** Implement the **Query Router**. Given a customer message, determine if it needs RAG, MCP (DB/API), both, or escalation.
- [x] **Milestone 5:** The AI can receive a prompt, decide to fetch live data via MCP or docs via RAG, and return a final cohesive answer.

### [x] Phase 6: Chat Widget & End-to-End Integration
**Goal:** Deliver the embeddable chat interface for end users.
- [x] **Widget (`widget/`):** Develop a lightweight, framework-agnostic TypeScript widget that embeds via a `<script>` tag.
- [x] **Widget (`widget/`):** Send messages to the backend using the public `widget_key` and handle `session_id`.
- [x] **Backend (`backend/`):** Validate `widget_key`, load the correct company context, run the AI Engine, and return the response to the widget.
- [x] **Milestone 6:** A functional chat widget can be embedded on any site, communicating with the central AI system and returning company-specific answers.

### [x] Phase 7: Conversation History & Human Escalation
**Goal:** Finalize the support experience with history and agent handoff.
- [x] **Backend (`backend/`):** Store chat histories per company and user session (`Conversation` and `Message` models). Mark conversations as "escalated" when requested or when AI fails to answer.
- [x] **Frontend (`frontend/`):** Build an inbox in the dashboard (`/dashboard/inbox`) for company agents to view and reply to escalated chats.
- [x] **Milestone 7:** Full end-to-end support workflow including AI deflection and human escalation.

### [x] Phase 8: Multi-Widget Data Segregation (Widget-Level Access Control)
**Goal:** Allow companies to create multiple widgets and restrict specific databases and knowledge base documents to specific widgets.
- [x] **Step 1: Database Schema Updates:** Add `WidgetTableAccess` and `WidgetDocumentAccess` mapping tables to `models.py` and run Alembic migrations.
- [x] **Step 2: API Updates:** Refactor `/api/widget-config` to support CRUD operations for multiple widgets per company, and endpoints to manage widget-data mappings.
- [x] **Step 3: AI Engine & RAG Security:** Update `engine.py` to call `list_tools(widget_key)` instead of `company_id`. Update Qdrant metadata tagging and querying to filter strictly by `widget_id`.
- [x] **Step 4: Frontend UI Updates (Pending Implementation by User):**
  - **`widget-settings/page.tsx`**: 
    - Change API call to `GET /api/widget-config/{company_id}` which now returns an *array* of widgets.
    - Add a sidebar or dropdown to select an active widget from the list.
    - Add a "Create Widget" button that posts a new config to `POST /api/widget-config/create`.
    - Change the save handler to use `PUT /api/widget-config/{widget_id}` to update the currently selected widget.
  - **`knowledge-base/page.tsx`**:
    - Fetch the list of widgets (`GET /api/widget-config/{company_id}`).
    - After successfully uploading a document via `POST /api/documents`, render a modal or checkbox list asking "Which widgets should access this document?".
    - Submit the selections by appending the new `doc_id` to the widget's allowed document IDs via `POST /api/widget-config/{widget_id}/documents`. *(Note: this API overwrites the widget's list, so the frontend must fetch existing `document_id`s first and append, or a new append API should be created).*
  - **`db-connections/page.tsx`**:
    - Fetch the list of widgets.
    - During the `handleSavePolicy` step (where allowed tables are chosen), present a selector for which widgets can access the newly approved tables.
    - Submit the selections via `POST /api/widget-config/{widget_id}/tables`, ensuring existing table mappings for those widgets are preserved and appended.

### [x] Phase 9: Document Management & Unlinking
**Goal:** Allow users to manage (view, edit access, or hard delete) documents after they have been uploaded.
- [x] **Backend (`backend/main.py`):**
  - Create `GET /api/documents/company/{company_id}` to fetch a list of all documents belonging to a company, including an array of `widget_ids` they are linked to.
  - Create `PUT /api/documents/{document_id}/widgets` to replace/update the list of widgets a document is linked to (by deleting old mappings in `widget_document_access` and inserting new ones).
  - Create `DELETE /api/documents/{document_id}` to permanently delete a document, its vector embeddings, and all its widget mappings.
- [x] **Frontend (`frontend/src/app/dashboard/knowledge-base/page.tsx`):**
  - Call the new `GET /api/documents/company/{company_id}` endpoint on load.
  - Render a "Your Uploaded Documents" list below the upload form showing filename, status, and size.
  - Add a "Manage Access" button next to each document that re-opens the `Widget Assignment Modal`, pre-checking the currently assigned widgets. Clicking save will call the new `PUT` endpoint.
  - Add a "Delete" button next to each document that calls the new `DELETE` endpoint to permanently free up space.

### [x] Phase 10: Database Connection Management & Widget Mapping View
**Goal:** Allow users to view and edit their connected databases, and manage which widgets have access to specific tables *after* the initial connection.
- [x] **Backend (backend/main.py & backend/schemas.py):**
  - Create GET /api/connections/database/company/{company_id} to fetch all active database connections for a company.
  - Create GET /api/connections/database/{connection_id}/widgets to fetch the current mapping of which widgets have access to which tables for a specific connection.
  - Create PUT /api/widget-config/{widget_id}/tables to *update* (overwrite) a widget's access to tables, rather than just appending.
  - Create DELETE /api/connections/database/{connection_id} to allow deleting a connection entirely.
- [x] **Frontend (frontend/src/app/dashboard/db-connections/page.tsx):**
  - Call the new GET /api/connections/database/company/{company_id} endpoint on load.
  - Render an "Active Connections" list or data table below (or beside) the "Connect New Database" form.
  - For each connection, display the connection name, type, and a "Manage Access" button.
  - When "Manage Access" is clicked, open a modal that fetches GET /api/connections/database/{connection_id}/widgets.
  - The modal should display a list of all tables in the connection, and for each table, a multi-select dropdown of widgets (or vice versa).
  - Add a "Save Changes" button in the modal that calls the new PUT endpoint to update mappings.
  - Add a "Delete Connection" button that calls the new DELETE endpoint and removes the connection from the UI.

### [x] Phase 11: Widget Archiving (Soft Delete) & Permanent Deletion
**Goal:** Allow users to deactivate (hide) widgets rather than permanently deleting them. Archiving preserves historical chat logs and allows easy recovery, while **disabling the widget's functionality on live websites** to prevent unwanted API usage. Also provide a permanent delete option for users who want to completely clear out unused widgets.
- [x] **Backend (`backend/models.py` & Alembic):**
  - Add an `is_active` boolean column (default True) to the `WidgetConfig` database model.
  - Generate and apply an Alembic migration for this schema change.
- [x] **Backend APIs (`backend/main.py`):**
  - Update `GET /api/widget-config/{company_id}` to either filter out archived widgets or include an `is_active` flag so the frontend can hide them.
  - Create a new `PUT /api/widget-config/{widget_id}/archive` endpoint to toggle this status.
  - Create a new `DELETE /api/widget-config/{widget_id}` endpoint to permanently delete a widget.
- [x] **Backend Public API Security (`backend/main.py`):**
  - Update `GET /api/public/widget-config/{widget_key}` to check if `is_active` is true. If false, return a 403 Forbidden or specific inactive status so the widget embed script doesn't render.
  - Update `POST /api/public/chat` to reject messages (403 Forbidden) if the widget is archived, preventing AI api usage.
- [x] **Frontend (`frontend/src/app/dashboard/widget-settings/page.tsx`):**
  - Update the "Select Widget" dropdown to visually indicate archived widgets. (Completed)
  - Add an "Archive Widget" button and modal. (Completed)
  - Add a "Permanent Delete" button with a red confirmation modal. (Completed)
  - **Enhancement:** Update the permanent delete confirmation modal to require the user to type "delete" into a text input before the delete button is enabled, preventing accidental deletions. (Completed)

### [x] Phase 12: Per-Widget AI Settings (Provider & Model)
**Goal:** Transition from a global company-wide LLM model configuration to a per-widget AI configuration, allowing different widgets to utilize different models and providers based on their specific use cases (e.g. GPT-4o for complex support vs Gemini Flash for simple lead capture), while maintaining a global credential vault for API keys.
- [x] **Step 1: Database Schema Updates (`backend/models.py`)**
  - Update `LLMConfig`: Remove `unique=True` from `company_id`. Add a `UniqueConstraint('company_id', 'provider')`. Remove `model` column. `LLMConfig` now acts purely as an API key vault for each provider.
  - Update `WidgetConfig`: Add `llm_provider` (default 'openai') and `llm_model` (nullable) columns to store the AI preference per widget.
  - Run Alembic migration to apply these changes.
- [x] **Step 2: API & Schema Updates (`backend/schemas.py`, `backend/main.py`)**
  - Update `LLMConfigUpdate` and `LLMConfigResponse` schemas to handle API keys per provider without requiring the `model`.
  - Update `WidgetConfigCreate`, `WidgetConfigUpdate`, and `WidgetConfigResponse` schemas to include `llm_provider` and `llm_model`.
  - Update `POST /api/llm-config` to upsert by `(company_id, provider)` instead of just `company_id`.
  - Update `GET /api/llm-config/{company_id}` to return a list of configured providers and their API key status (e.g., `List[LLMConfigResponse]`).
  - Update `POST /api/widget-config/create` and `PUT /api/widget-config/{widget_id}` to accept and save `llm_provider` and `llm_model`.
- [x] **Step 3: AI Engine Update (`backend/engine.py` or similar)**
  - When a chat request comes in via `WidgetChatRequest` (which contains `widget_key`), fetch the `WidgetConfig` to determine the chosen `llm_provider` and `llm_model`.
  - Then, query `LLMConfig` for the matching `company_id` and `provider` to retrieve the decrypted API key.
  - Pass the widget-specific model and provider to the LLM SDKs.
- [x] **Step 4: Frontend UI Updates (`frontend/src/app/dashboard/ai-settings/page.tsx` & `widget-settings/page.tsx`)**
  - **`ai-settings/page.tsx`**: Remove the "Model" input field. Refactor the page to act as a global "API Keys Vault" where users can input and save their API keys for multiple providers (OpenAI, Gemini, Anthropic).
  - **`widget-settings/page.tsx`**: Add an "AI Configuration" section within the widget settings form containing dropdowns for "LLM Provider" and "Model". Populate the provider dropdown with the providers configured in the global AI Settings.

### [x] Phase 13: Multiple Named API Keys Support
**Goal:** Allow companies to configure multiple API keys for the same provider (e.g., separate billing accounts for Sales vs Support) by naming them, and link widgets to a specific named key configuration rather than just a generic provider string.
- [x] **Step 3: AI Engine Integration (`backend/main.py`)**
  - In `/api/widget-chat` and `/api/chat`: Fetch the specific `LLMConfig` using the widget's `llm_config_id`.
  - Extract the specific `provider` and `api_key` from that config, and pass them into `EngineConfig`.
  - Add fallback logic: If a widget has no `llm_config_id` set, either fallback to the first available company key or return a clear error.
- [x] **Step 4: Frontend UI Updates (`frontend/src/app/dashboard/ai-settings/page.tsx` & `widget-settings/page.tsx`)**
  - **`ai-settings/page.tsx`**: Redesign to show a list/table of saved named keys (e.g., "Support Team OpenAI", "Sales Gemini"). Add a form/modal to add new keys (Name, Provider, API Key) and delete existing ones.
  - **`widget-settings/page.tsx`**: Update the "AI Configuration" section. The dropdown should now display the company's specific named keys instead of generic providers. Save the selected key's `id` as `llm_config_id`.

### [x] Phase 14: Hybrid Database Connection UI (Raw Connection String Support)
**Goal:** Enhance the UX by allowing users to paste a single, fully-formatted database connection string (URI) instead of manually filling out individual fields (Host, Port, Username, etc.). The system will parse the string to maintain compatibility with the existing database schema and driver-restricted dropdown logic.
- [x] **Step 1: Backend API Refactoring (`backend/schemas.py`, `backend/main.py`)**
  - Update `DBConnectionCreate` schema to make `host`, `port`, `username`, `password`, and `database_name` optional if a new `connection_string` field is provided.
  - In `POST /api/connections/database`, add parsing logic using SQLAlchemy's `make_url` to extract the individual fields from the `connection_string` (if provided).
  - Validate that the parsed protocol matches the selected `db_type` from the UI dropdown (e.g., `postgresql://` matches `postgres`) to guarantee driver compatibility.
  - Save the parsed fields to the existing `DatabaseConnection` database model (no Alembic migrations required).
- [x] **Step 2: Frontend UI Updates (`frontend/src/app/dashboard/db-connections/page.tsx`)**
  - Keep the existing "Type" dropdown to enforce safe driver selection.
  - Add a toggle switch or tab system inside the connection form: "Standard Form" vs "Use Connection String".
  - If "Use Connection String" is selected, hide the individual input boxes and show a single text input for the URI.
  - Update the submit handler to send the `connection_string` payload to the backend when the toggle is active.

### [x] Phase 15: Microsoft SQL Server (MSSQL) Support
**Goal:** Expand the platform's enterprise reach by supporting Microsoft SQL Server, integrating seamlessly into the existing SQLAlchemy architecture.
- [x] **Step 1: Dependency Updates**
  - Add `pymssql` to both `backend/requirements.txt` and `mcp/requirements.txt`.
- [x] **Step 2: Connection Logic (`backend/connectors.py` & `mcp/executor.py`)**
  - In `connectors.py`, add `elif db_type == "sqlserver":` and format the connection URL as `mssql+pymssql://{username}:{password}@{host}:{port}/{database_name}`.
  - Replicate this URL construction in `mcp/executor.py`'s `_build_connection_url` function to enable live MCP querying.
- [x] **Step 3: Frontend UI (`frontend/src/app/dashboard/db-connections/page.tsx`)**
  - Add "Microsoft SQL Server" (with value `sqlserver`) to the Database Type dropdown menu.

### [x] Phase 16: MongoDB (NoSQL) Support & Architecture Update
**Goal:** Introduce support for MongoDB. Since it is a NoSQL database, this phase requires bypassing SQLAlchemy and introducing specialized connection logic and AI prompt handling for NoSQL aggregation pipelines.
- [x] **Step 1: Dependency Updates**
  - Add `pymongo` to both `backend/requirements.txt` and `mcp/requirements.txt`.
- [x] **Step 2: NoSQL Connection Logic (`backend/connectors.py` & `backend/main.py`)**
  - Create a new function `test_mongo_connection_and_get_collections` using `pymongo.MongoClient` to authenticate and fetch a list of collection names (since MongoDB has no "tables").
  - Update the `/api/connections/database` route to call this new function instead of the SQLAlchemy function when `db_type == "mongodb"`.
- [x] **Step 3: MCP NoSQL Tool (`mcp/executor.py` & `mcp/tools.py`)**
  - Create a new, dedicated MCP tool (e.g., `execute_mongo_query`) that accepts and executes MongoDB JSON queries/aggregation pipelines via `pymongo`, completely separate from the existing SQL execution tool.
- [x] **Step 4: AI Engine Routing & Prompting**
  - Update the AI Query Router to detect the `db_type` of the requested widget. If it is `mongodb`, the system prompt must explicitly instruct the LLM to generate MongoDB syntax (JSON) instead of SQL.
- [x] **Step 5: Frontend UI (`frontend/src/app/dashboard/db-connections/page.tsx`)**
  - Add "MongoDB" (with value `mongodb`) to the Database Type dropdown menu.

### [x] Phase 17: Widget Key Visibility and Embed Script Migration
**Goal:** The system was recently upgraded to support multiple widgets per company (moving widget_key from the Company table to individual WidgetConfig records). Because of this, the main Dashboard page is currently trying to render a single company.widget_key which is undefined. We must migrate the "Embed Widget" logic to the Widget Settings page where individual widgets are managed.

**Code Analysis & Changes Required:**
- **Issue 1: Main Dashboard (`frontend/src/app/dashboard/page.tsx`)**
  - *Current State:* Hardcodes `<script ... data-widget-key="{company.widget_key}">` which is `undefined` because multiple widgets exist now.
  - *Fix:* Remove the "Public Widget Key" row from the Credentials section. Retain the "Embed Chat Widget" visual box on the dashboard, but set `data-widget-key="YOUR_WIDGET_KEY"`. Users will go to the Widget Settings page to get the actual key for their desired widget.
- **Issue 2: Widget Settings Page (`frontend/src/app/dashboard/widget-settings/page.tsx`)**
  - *Current State:* Allows creating and editing multiple widgets, but never displays the widget_key or the embed script to the user.
  - *Fix:* Inject a new "Embed Your Widget" section at the top of the selected widget's configuration form. It should display the selected widget's widget_key and provide a "Copy to Clipboard" button for the <script> tag.
- **Issue 3: Types (`frontend/src/app/dashboard/widget-settings/page.tsx`)**
  - *Current State:* The WidgetConfig type in the frontend does not include widget_key.
- **Next Phase Preparation:**
  - After these UI changes, we will need to implement the actual widget.js static file that reads this data-widget-key and injects the floating chat interface.

### [ ] Phase 18: Database Connections UI Layout Refactor
**Goal:** Prevent vertical page bloat caused by the "Connect New Database" form when users have multiple databases, and clarify the widget access mapping UI.
- [ ] **Step 1: Refactor "Connect New Database" Form**
  - Extract the existing form (Standard Form & Connection String modes) into a reusable Modal or Slide-out Drawer component.
  - Add a primary `+ Add Database` button to the top of the "Database Connections" page.
- [ ] **Step 2: Enhance "Active Connections" List**
  - Update connection cards to be more compact or switch to a table layout.
  - Make cards selectable to enter an active state (`selectedConnectionId`).
- [ ] **Step 3: Implement Dynamic "Widget Access" Panel**
  - Repurpose the right-side panel ("No tables yet") to respond to the selected database.
  - When a database is selected, display a list of all available widgets with toggles/checkboxes to manage access.
  - Include "Save Changes" and "Cancel" actions to send the updated `widget_ids` to the backend.
