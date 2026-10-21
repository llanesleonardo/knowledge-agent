# System File Audit — 3L Knowledge Agent

**Project:** 3L Knowledge Agent  
**Version:** 0.1.0  
**Audited Directory:** `c:\Users\Leonardo\Documents\repositories\knowledge-agent`  
**Date of Audit:** October 2026  
**Auditor:** Systems Engineering & Architectural Assurance  

---

## 1. Executive Summary & Inventory Overview

The **3L Knowledge Agent** is a native Next.js 16 App Router application built in TypeScript, architected as a local-first, privacy-preserving, retrieval-augmented knowledge assistant. The codebase provides a complete end-to-end stack: multi-format document ingestion, local or cloud vector and keyword search, customizable specialist agent profiles, conversation state tracking, and pluggable persistence and storage backends.

### Inventory Metrics

| Metric | Value |
| :--- | :--- |
| **Total Non-Generated Files Audited** | 38 files |
| **TypeScript / JavaScript Code Files** | 21 files |
| **Styles / UI Assets** | 3 files (`globals.css`, `layout.tsx`, `favicon.svg`) |
| **Configuration & Manifest Files** | 8 files (`package.json`, `tsconfig.json`, `compose.yaml`, etc.) |
| **Database & Fixture Data Files** | 2 files (`postgresql.sql`, `workspace.json`) |
| **Architecture & Documentation Files** | 4 files (`README.md`, `Knowledge_Agent_Architecture.pdf`, `png`, `.env.example`) |
| **Total Source Code Lines (excl. locks/css)** | ~3,350 LOC |
| **Total Build / Dependency Artifacts Excluded** | `node_modules/`, `.next/`, `.git/` |

---

## 2. Master File Catalog

The following table indexes every non-ignored repository file, its size, lines of code (LOC), architectural tier, and core operational role.

| # | File Path | Format | Size (Bytes) | Lines | Architectural Tier | Core Operational Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `package.json` | JSON | 1,216 | 47 | Configuration / Build | Project manifest, npm scripts, runtime & dev dependencies |
| 2 | `package-lock.json` | JSON | 149,913 | 4,187 | Configuration / Build | Deterministic npm dependency lockfile |
| 3 | `pnpm-lock.yaml` | YAML | 85,956 | 2,609 | Configuration / Build | Alternative pnpm dependency lockfile |
| 4 | `tsconfig.json` | JSON | 698 | 42 | Configuration / Build | TypeScript compiler configuration (strict mode, path aliases) |
| 5 | `tsconfig.tsbuildinfo` | Binary/JSON | 230,115 | 1 | Build Artifact | Incremental TypeScript compiler cache |
| 6 | `next.config.ts` | TypeScript | 143 | 4 | Configuration / Server | Next.js server configuration, external packages setup |
| 7 | `next-env.d.ts` | TypeScript | 303 | 8 | Configuration / Types | Next.js auto-generated TypeScript environment declarations |
| 8 | `postcss.config.mjs` | ESM JS | 94 | 8 | Configuration / Styles | PostCSS pipeline configuration for Tailwind CSS v4 |
| 9 | `compose.yaml` | YAML | 553 | 22 | Infrastructure / Ops | Docker Compose service definitions for PostgreSQL & Qdrant |
| 10 | `.env.example` | Env | 750 | 25 | Configuration / Sec | Environment variable template for credentials and endpoints |
| 11 | `.gitignore` | Git | 85 | 9 | Configuration / VCS | Git exclusion rules (node_modules, build caches, secrets) |
| 12 | `README.md` | Markdown | 7,611 | 153 | Documentation | Operational guide, architecture, setup, and run instructions |
| 13 | `public/favicon.svg` | SVG | 326 | 2 | Presentation / Static | Application browser tab icon |
| 14 | `app/layout.tsx` | TypeScript (TSX) | 591 | 26 | Presentation / Shell | Root HTML shell, KaTeX stylesheet import, document metadata |
| 15 | `app/globals.css` | CSS | 47,015 | 2,761 | Presentation / Styles | Tailwind v4 theme, utility classes, typography, variables |
| 16 | `app/page.tsx` | TypeScript (TSX) | 71,879 | 2,035 | Presentation / Client | Single-page client UI (Chat, Library, Agents, Connections) |
| 17 | `app/api/agents/route.ts` | TypeScript | 653 | 23 | Controller / API | Endpoint for updating specialist agent configurations |
| 18 | `app/api/chat/route.ts` | TypeScript | 3,892 | 100 | Controller / API | Conversational RAG pipeline, context building, model invoking |
| 19 | `app/api/connections/route.ts` | TypeScript | 1,684 | 52 | Controller / API | Connection status reporting and settings mutation endpoint |
| 20 | `app/api/documents/route.ts` | TypeScript | 5,644 | 158 | Controller / API | Document ingestion, text extraction, chunking, indexing, deletion |
| 21 | `app/api/source/route.ts` | TypeScript | 958 | 28 | Controller / API | Binary/text original document streaming download endpoint |
| 22 | `app/api/workspace/route.ts` | TypeScript | 323 | 13 | Controller / API | Full workspace state retrieval (agents, docs, chats, settings) |
| 23 | `lib/knowledge/types.ts` | TypeScript | 1,249 | 66 | Domain / Data Model | Core domain types: Agent, Chunk, Document, Citation, Message, Workspace |
| 24 | `lib/knowledge/seeds.ts` | TypeScript | 6,207 | 83 | Domain / Fixtures | Default seeded agents, settings, and initial battery/guide docs |
| 25 | `lib/knowledge/platform.ts` | TypeScript | 210 | 8 | Domain / Platform | Runtime secret and environment variable resolver |
| 26 | `lib/knowledge/http.ts` | TypeScript | 442 | 13 | Domain / HTTP | HTTP error formatting helper (`fail`) and request payload limiter |
| 27 | `lib/knowledge/gateway.ts` | TypeScript | 2,809 | 82 | Domain / AI Gateway | LangChain model instantiation, embeddings, image transcription |
| 28 | `lib/knowledge/retrieval.ts` | TypeScript | 4,957 | 160 | Domain / Search | Keyword search algorithm, Qdrant vector indexer & query engine |
| 29 | `lib/knowledge/store.ts` | TypeScript | 3,115 | 95 | Domain / Persistence | High-level repository abstraction (PostgreSQL or local file records) |
| 30 | `lib/knowledge/storage.ts` | TypeScript | 2,742 | 82 | Domain / File Storage | Original document storage adapter (Azure Blob, local filesystem) |
| 31 | `lib/knowledge/local-records.ts` | TypeScript | 2,100 | 69 | Domain / Persistence | Transactional single-file JSON database adapter (`workspace.json`) |
| 32 | `lib/knowledge/cloudflare-node.ts` | TypeScript | 2,100 | 69 | Domain / Persistence | Code copy of `local-records.ts` (legacy Cloudflare/Node shim) |
| 33 | `database/postgresql.sql` | SQL | 198 | 7 | Persistence / DDL | Schema definition for `knowledge_records` table and index |
| 34 | `data/workspace.json` | JSON | 7,217 | 1 | Persistence / Data | Active local database file storing seeded state and records |
| 35 | `tests/verify.mjs` | Node.js (MJS) | 1,238 | 13 | Verification / Test | Test harness executing Next.js production server and smoke runner |
| 36 | `tests/smoke.mjs` | Node.js (MJS) | 5,364 | 151 | Verification / Test | 12-stage end-to-end integration and security test suite |
| 37 | `docs/Knowledge_Agent_Architecture.pdf` | PDF | 46,913 | 305 | Architecture / Spec | Architectural diagram vector publication |
| 38 | `docs/Knowledge_Agent_Architecture.png` | PNG Image | 348,479 | 876 | Architecture / Spec | High-resolution architectural diagram raster image |

---

## 3. Tier-by-Tier In-Depth File Audit

### Tier 1: System Configuration, Infrastructure & Tooling

#### 1. `package.json`
- **Location:** `./package.json`
- **Purpose:** Declares package identity (`3l-knowledge-agent`), Node engine requirements (`>=22.13.0`), scripts (`dev`, `build`, `start`, `typecheck`, `test:smoke`, `format`), and package dependencies.
- **Dependencies Evaluated:**
  - Runtime: `next` (16.3.4), `react` / `react-dom` (19.2.6), `lucide-react` (icons), `langchain` / `@langchain/core` / `@langchain/openai` / `@langchain/textsplitters` (LLM & chunking), `@neondatabase/serverless` + `pg` (PostgreSQL), `unpdf` (PDF parsing), `zod` (runtime schema validation), `react-markdown` / `remark-gfm` / `remark-math` / `rehype-katex` / `katex` (rich response rendering).
  - Dev: `typescript` (5.9.3), `@tailwindcss/postcss` / `tailwindcss` (4.2.1), `prettier` (3.9.10).
- **Assessment:** Clean, modern dependencies. Pinned to stable major versions. No unnecessary external heavy frameworks.

#### 2. `compose.yaml`
- **Location:** `./compose.yaml`
- **Purpose:** Container orchestration for local infrastructure dependencies.
- **Services Defined:**
  - `postgres`: Image `postgres:17-alpine`, bound to `127.0.0.1:5432`, mounts `database/postgresql.sql` into `/docker-entrypoint-initdb.d/` for automatic schema bootstrap.
  - `qdrant`: Image `qdrant/qdrant:latest`, bound to `127.0.0.1:6333`, mounts named volume `knowledge_vectors`.
- **Security & Network:** Services bind strictly to `127.0.0.1`, mitigating accidental public port exposure.

#### 3. `.env.example`
- **Location:** `./.env.example`
- **Purpose:** Blueprint for server-only environment variables.
- **Variables Documented:**
  - AI Providers: `OPENAI_API_KEY`, `OPENROUTER_API_KEY`, `LOCAL_LLM_BASE_URL`, `LOCAL_LLM_API_KEY`, `VISION_MODEL`.
  - Embeddings & Qdrant: `EMBEDDING_BASE_URL`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`, `EMBEDDING_IS_LOCAL`, `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION`.
  - Database: `DATABASE_URL`, `DATABASE_DRIVER` (`pg` vs `neon`).
  - Storage: `LOCAL_DATA_PATH`, `LOCAL_STORAGE_PATH`, `AZURE_BLOB_CONTAINER_URL`, `AZURE_BLOB_SAS_TOKEN`.
- **Security Check:** Contains zero default production secrets. Includes explicit warning: "Server-only values. Never use NEXT_PUBLIC_ for credentials."

#### 4. `next.config.ts`
- **Location:** `./next.config.ts`
- **Purpose:** Configures Next.js runtime build options. Declares `serverExternalPackages: ["pg", "unpdf"]` to prevent Webpack/Turbopack from improperly bundling Node native/binary CJS packages.
- **Assessment:** Essential for reliable Node.js server execution in Next.js 16.

#### 5. `tsconfig.json` & `next-env.d.ts`
- **Location:** `./tsconfig.json`, `./next-env.d.ts`
- **Purpose:** Configures TypeScript with `strict: true`, target `ES2017`, `moduleResolution: bundler`, and root path alias mapping (`@/*` -> `./*`).
- **Assessment:** Validated via `npm run typecheck` with 0 errors.

#### 6. `postcss.config.mjs` & `.gitignore`
- **Location:** `./postcss.config.mjs`, `./.gitignore`
- **Purpose:** PostCSS configuration for Tailwind CSS v4; `.gitignore` prevents leaks of `node_modules/`, `.next/`, `data/`, `.env*` secrets, and build caches.

---

### Tier 2: Presentation & Client-Side Application Layer

#### 7. `app/layout.tsx`
- **Location:** `./app/layout.tsx`
- **Purpose:** Root layout component for Next.js App Router.
- **Responsibilities:**
  - Loads KaTeX styling (`katex/dist/katex.min.css`) and global Tailwind CSS (`./globals.css`).
  - Sets application metadata (title: "3L Knowledge — Your knowledge, connected", description, favicon links).
  - Renders base HTML shell with antialiased font smoothing.

#### 8. `app/globals.css`
- **Location:** `./app/globals.css`
- **Purpose:** Defines base design system styling, dark/light theme variables, custom scrollbars, and Markdown typography formatting.
- **Key Features:** Full KaTeX math support, code block syntax styling, responsive layout utilities.

#### 9. `app/page.tsx`
- **Location:** `./app/page.tsx`
- **Purpose:** Primary client single-page application (SPA) shell containing all four major user workflows:
  1. **Chat View (`view === "chat"`):**
     - Message thread visualization with markdown formatting and LaTeX formula rendering.
     - Source citations cards showing document name, page number, and similarity score.
     - Conversation management (new chat, history drawer, delete, title auto-generation).
     - Inline prompt suggestions and quick command bar (`/ingest`, `/knowledge add`).
  2. **Library View (`view === "library"`):**
     - Knowledge document table with filtering by topic and status (`ready` vs `draft`).
     - Upload modal supporting drag-and-drop or file selection for PDF, Markdown, TXT, CSV, and Images.
     - Text paste ingestion modal with topic selection.
     - Document management operations: status toggle (Draft <-> Ready), manual Qdrant re-index trigger, original source download, and document deletion.
  3. **Agents View (`view === "agents"`):**
     - Specialist agent editor (name, description, topic constraint, custom prompt instructions, color theme, icon, enable/disable toggle).
  4. **Connections View (`view === "connections"`):**
     - Stack status monitors (OpenAI, OpenRouter, Local LLM, Embeddings, Qdrant, Database, Storage).
     - AI provider selector (`demo`, `openai`, `openrouter`, `local`).
     - Parameter tuning: Model identifier, Temperature slider (0.0 to 1.0), Citation toggle, Retrieval engine (`keyword` vs `qdrant`), and Local-Only routing toggle.
- **State Management:** React hooks (`useState`, `useEffect`, `useRef`). Polling and optimistic updates for responsive interaction.

---

### Tier 3: API & Controller Routing Layer

#### 10. `app/api/workspace/route.ts`
- **Location:** `./app/api/workspace/route.ts`
- **HTTP Methods:** `GET` (Dynamic: `force-dynamic`, `Cache-Control: no-store`)
- **Purpose:** Delivers complete workspace state snapshot: all agents, knowledge documents, conversation history, and user settings.
- **Error Handling:** Returns JSON error response with status 500 upon store failure.

#### 11. `app/api/connections/route.ts`
- **Location:** `./app/api/connections/route.ts`
- **HTTP Methods:** `GET`, `PUT`
- **Purpose:**
  - `GET`: Queries environment variables and runtime bindings to report configured services without exposing confidential API keys.
  - `PUT`: Validates incoming settings payload against Zod schema (`provider`, `model`, `temperature`, `citations`, `retrieval`, `localOnly`). Enforces that `localOnly: true` rejects cloud providers (`openai`, `openrouter`). Persists updated settings.

#### 12. `app/api/agents/route.ts`
- **Location:** `./app/api/agents/route.ts`
- **HTTP Methods:** `PUT`
- **Purpose:** Validates specialist agent configuration via Zod (`id`, `name`, `description`, `topic`, `instructions`, `color`, `icon`, `enabled`). Updates record in repository.

#### 13. `app/api/chat/route.ts`
- **Location:** `./app/api/chat/route.ts`
- **HTTP Methods:** `POST`, `DELETE`
- **Purpose:**
  - `POST`: Implements core RAG conversation pipeline:
    1. Validates `question` (1–5000 chars) and `agentId`.
    2. Verifies selected agent exists and is enabled.
    3. Contextual search expansion: if query is brief (< 8 words) and follow-up, appends preceding user question.
    4. Executes `retrieve()` against documents matching agent topic constraint and status `ready`.
    5. Dispatches to either Demo mode (extractive source excerpts) or Connected mode (LangChain ChatOpenAI prompt with system prompt grounding constraints).
    6. Appends user and assistant messages to conversation history; persists to database.
  - `DELETE`: Removes conversation thread by `id`.

#### 14. `app/api/documents/route.ts`
- **Location:** `./app/api/documents/route.ts`
- **HTTP Methods:** `POST`, `PATCH`, `DELETE`
- **Purpose:**
  - `POST`: Document ingestion pipeline:
    1. Enforces upload limits: 5 MB file size limit, 1 MB pasted text limit, 250,000 maximum extracted character limit.
    2. Multi-format text extraction:
       - **PDF:** Uses `unpdf` to extract page-by-page text, preserving page numbering metadata.
       - **Text/MD/CSV:** Decodes UTF-8 text.
       - **Images (PNG/JPG/WEBP):** Calls `extractImage()` via configured vision model to transcribe text, formulas, and tables into Markdown.
    3. Text chunking: `RecursiveCharacterTextSplitter` (chunkSize: 1400, chunkOverlap: 180).
    4. Stores original binary in storage adapter (`storeFile`).
    5. Saves document metadata and chunks into database (`putRecord`).
    6. If Qdrant retrieval is active, indexes chunks via `indexDocument` (graceful degradation if vector index fails).
  - `PATCH`: Modifies document status (`ready` / `draft`) or triggers vector re-indexing.
  - `DELETE`: Removes document chunks and metadata, deletes original file from storage, and purges vector points from Qdrant.

#### 15. `app/api/source/route.ts`
- **Location:** `./app/api/source/route.ts`
- **HTTP Methods:** `GET`
- **Purpose:** Serves original uploaded source files with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`. If original binary is unavailable, falls back to reconstituting text from document chunks.

---

### Tier 4: Core Domain Logic & Orchestration (`lib/knowledge`)

#### 16. `lib/knowledge/types.ts`
- **Location:** `./lib/knowledge/types.ts`
- **Purpose:** Canonical TypeScript interfaces for the domain:
  - `Agent`: Specialist configuration, topic restriction, instructions.
  - `Chunk`: Text chunk with `id`, `text`, `page`, `documentId`.
  - `KnowledgeDocument`: Metadata, type, topic, status (`ready` | `draft`), chunks, size, vector indexing flags.
  - `Citation`: Source excerpt returned to user with page, name, text, and similarity score.
  - `Message`: Chat message with role, content, citations, mode.
  - `Conversation`: Thread with id, title, agentId, messages, updatedAt.
  - `Settings`: Provider, model, temperature, citations flag, retrieval mode, localOnly flag.
  - `Workspace`: Aggregate root containing agents, documents, conversations, and settings.

#### 17. `lib/knowledge/seeds.ts`
- **Location:** `./lib/knowledge/seeds.ts`
- **Purpose:** Default initial configuration:
  - `defaultSettings`: Demo provider, temperature 0.2, keyword search, localOnly false.
  - `defaultAgents`: "Knowledge assistant" (`topic: "all"`), "Battery specialist" (`topic: "Battery science"`), "Product guide" (`topic: "User guides"`).
  - `sampleDocuments`: Three foundational Markdown guides ("Battery fundamentals.md", "Electrolyte properties.md", "Getting started.md") partitioned into semantic chunks.

#### 18. `lib/knowledge/platform.ts`
- **Location:** `./lib/knowledge/platform.ts`
- **Purpose:** Environment abstraction layer. Provides `secret(name)` to resolve environment variables from `process.env` or local mock bindings, and `binding(name)` for platform handles.

#### 19. `lib/knowledge/http.ts`
- **Location:** `./lib/knowledge/http.ts`
- **Purpose:** Standardized HTTP response utilities:
  - `fail(error, status)`: Formats error into `{ error: string }` JSON with appropriate HTTP status code.
  - `safeJson(request)`: Safeguards against oversized payloads (> 200 KB) before JSON parsing.

#### 20. `lib/knowledge/gateway.ts`
- **Location:** `./lib/knowledge/gateway.ts`
- **Purpose:** Integrates LangChain model and embedding adapters:
  - `chatModel(s)`: Instantiates `ChatOpenAI` configured for OpenAI, OpenRouter, or local OpenAI-compatible endpoints (`LOCAL_LLM_BASE_URL`). Enforces `localOnly` routing policy.
  - `embeddings(localOnly)`: Instantiates `OpenAIEmbeddings` using `EMBEDDING_BASE_URL` and `EMBEDDING_MODEL`. Enforces `EMBEDDING_IS_LOCAL=true` if local-only routing is mandated.
  - `extractImage(bytes, type, s)`: Performs vision transcription using vision model prompt to faithfully transcribe image text, formulas, and tables into Markdown.

#### 21. `lib/knowledge/retrieval.ts`
- **Location:** `./lib/knowledge/retrieval.ts`
- **Purpose:** Dual-mode search engine:
  - `keywordSearch(question, documents)`: Stop-word filtered term frequency scoring across document chunks. Fast, in-memory, deterministic.
  - `indexDocument(doc, localOnly)`: Generates chunk embeddings, verifies or creates Qdrant collection with matching vector dimension, and upserts points with chunk payload metadata.
  - `removeVectors(documentId)`: Purges Qdrant vector points matching `documentId`.
  - `retrieve(question, docs, agent, s)`: Unified retrieval dispatcher. Enforces `status === "ready"` and specialist `agent.topic` matching. Routes to either `keywordSearch` or Qdrant cosine vector similarity query (score threshold >= 0.25, top 4 results).

#### 22. `lib/knowledge/store.ts`
- **Location:** `./lib/knowledge/store.ts`
- **Purpose:** Data persistence abstraction. Supports either PostgreSQL (via `pg` Pool or `@neondatabase/serverless`) or local file storage (`local-records.ts`). Exposes `putRecord`, `removeRecord`, `listRecords`, and `workspace`. Automatically seeds default data on first execution.

#### 23. `lib/knowledge/storage.ts`
- **Location:** `./lib/knowledge/storage.ts`
- **Purpose:** Binary original document storage adapter:
  - Supports Azure Blob Storage (REST API with SAS token) when `AZURE_BLOB_CONTAINER_URL` is set.
  - Falls back to local filesystem storage (`LOCAL_STORAGE_PATH`, default `./data/uploads`).
  - Provides `storeFile`, `readFile`, `deleteFile`.

#### 24. `lib/knowledge/local-records.ts`
- **Location:** `./lib/knowledge/local-records.ts`
- **Purpose:** Transactional single-file JSON database adapter for local standalone operation.
- **Concurrency & Integrity:** Uses a sequential Promise chain (`pending`) and atomic file write-and-rename (`workspace.json.tmp` -> `workspace.json`) to prevent write tearing or race conditions in a single Node process.

#### 25. `lib/knowledge/cloudflare-node.ts`
- **Location:** `./lib/knowledge/cloudflare-node.ts`
- **Assessment / Technical Debt:** This file is an exact byte-for-byte duplicate of `local-records.ts` (size: 2,100 bytes, 69 lines). It appears to be an unused legacy shim or duplicate from prior refactoring.

---

### Tier 5: Persistence, Schemas & Fixtures

#### 26. `database/postgresql.sql`
- **Location:** `./database/postgresql.sql`
- **Purpose:** PostgreSQL DDL schema definition.
- **Schema Details:**
  ```sql
  CREATE TABLE IF NOT EXISTS knowledge_records (
    id text PRIMARY KEY,
    kind text NOT NULL,
    data text NOT NULL
  );
  CREATE INDEX IF NOT EXISTS knowledge_records_kind_idx ON knowledge_records(kind);
  ```
- **Design:** Key-value/document store pattern inside PostgreSQL. Stores serialized JSON payloads by `kind` (`agent`, `document`, `conversation`, `settings`, `initialized`).

#### 27. `data/workspace.json`
- **Location:** `./data/workspace.json`
- **Purpose:** Active local file storage database. Automatically created and managed by `local-records.ts` when running without PostgreSQL.

---

### Tier 6: Verification, Testing & Quality Assurance

#### 28. `tests/verify.mjs`
- **Location:** `./tests/verify.mjs`
- **Purpose:** Automated test runner harness.
- **Workflow:**
  1. Creates temporary isolated directory in OS tmpdir (`knowledge-verification-XXXXXX`).
  2. Spawns Next.js production server (`next start`) on port 3199 with isolated `LOCAL_DATA_PATH`.
  3. Waits for server "Ready" signal.
  4. Spawns `tests/smoke.mjs` targeting the running instance.
  5. Tears down server with `SIGTERM` and recursively purges temporary test directory.

#### 29. `tests/smoke.mjs`
- **Location:** `./tests/smoke.mjs`
- **Purpose:** End-to-end integration and security test suite validating 12 specific operational requirements:
  1. Initial workspace seed verification.
  2. Security check: `/api/connections` does not leak credentials or API keys.
  3. Input validation: Blank questions return HTTP 400.
  4. Demo retrieval returns grounded source citations in "Source preview" mode.
  5. Ingestion of draft content.
  6. Security & correctness: Draft content is strictly excluded from chat retrieval.
  7. Publication transition: Document status changed to `ready` becomes immediately retrievable.
  8. Specialist agent scoping: Topic restrictions prevent cross-topic document exposure.
  9. Original document binary download verification.
  10. PDF parser verification: Page numbering and text extraction preserved across pages.
  11. Data persistence verification: Records persist across distinct HTTP requests.
  12. Air-gap policy enforcement: Setting cloud provider (`openai`) while `localOnly: true` is rejected with HTTP 400.

---

### Tier 7: Architecture Documentation & Visual Specifications

#### 30. `README.md`
- **Location:** `./README.md`
- **Purpose:** Primary operational handbook covering deployment, model connection parameters, PostgreSQL and Qdrant setup, Azure Blob integration, ingestion limits, and security boundaries.

#### 31. `docs/Knowledge_Agent_Architecture.pdf` & `docs/Knowledge_Agent_Architecture.png`
- **Location:** `./docs/Knowledge_Agent_Architecture.pdf`, `./docs/Knowledge_Agent_Architecture.png`
- **Purpose:** Systems engineering architecture blueprint illustrating the relationship between UI, Next.js Server API, Agent Profiles, LangChain Workflow, Ingestion, AI Gateway, Retrieval Service, and Data Layer.

---

## 4. Technical Debt, Security Posture & Optimization Findings

1. **Code Duplication:**
   `lib/knowledge/cloudflare-node.ts` is an exact duplicate of `lib/knowledge/local-records.ts`. Recommendation: Delete `cloudflare-node.ts` or refactor into a shared adapter to reduce maintenance confusion.
2. **Authentication & Multi-Tenancy:**
   The application currently operates as a single-tenant local workspace. There are no session tokens, user IDs, or document-level access control lists (ACLs). Exposing the application outside of `127.0.0.1` requires an authentication reverse proxy or NextAuth/Auth0 integration.
3. **Synchronous Ingestion Limits:**
   Document processing runs synchronously in the HTTP request cycle (`POST /api/documents`). While protected by a 5 MB upload limit and 250,000 character cap, large documents or multi-page image batches may face HTTP timeout constraints under high load. A background job queue (e.g. BullMQ / Redis) is recommended for production scale.
4. **Vector / Keyword Hybridization:**
   Retrieval is currently either pure Keyword or pure Qdrant vector search. A future enhancement should incorporate Reciprocal Rank Fusion (RRF) and re-ranking for optimal retrieval accuracy.

---

*File Audit completed and verified against codebase.*
