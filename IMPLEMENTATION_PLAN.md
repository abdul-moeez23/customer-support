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
