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

### [ ] Phase 8: Multi-Widget Data Segregation (Widget-Level Access Control)
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

### [x] Phase 11: Widget Archiving (Soft Delete)
**Goal:** Allow users to deactivate (hide) widgets rather than permanently deleting them. Archiving is chosen over hard deletion to preserve historical chat logs, prevent broken embed scripts on customer websites, and allow easy recovery.
- [x] **Backend (`backend/models.py` & Alembic):**
  - Add an `is_active` boolean column (default True) to the `WidgetConfig` database model.
  - Generate and apply an Alembic migration for this schema change.
- [x] **Backend APIs (`backend/main.py`):**
  - Update `GET /api/widget-config/{company_id}` to either filter out archived widgets or include an `is_active` flag so the frontend can hide them.
  - Create a new `PUT /api/widget-config/{widget_id}/archive` endpoint to toggle this status.
- [x] **Frontend (`frontend/src/app/dashboard/widget-settings/page.tsx`):**
  - Update the "Select Widget" dropdown to visually indicate archived widgets (e.g., "(Archived)") or filter them out unless a "Show Archived" toggle is checked.
  - Add an "Archive Widget" button at the bottom of the widget settings form (styled differently from the Save button, perhaps a muted red or outlined gray button).
  - Add a confirmation modal (similar to the ones designed in Phase 9/10) to confirm archiving, explaining that it hides the widget but preserves history.can find and re-activate hidden widgets.
