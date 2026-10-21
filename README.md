# 3L Knowledge Agent

Native Next.js App Router + TypeScript knowledge assistant. Includes chat, source citations, document viewer, ingestion, specialist profiles, saved conversations, and connection preferences. Runs on your computer without a cloud browser or deployment account.

## Run

Use Node.js 22.13 or later (Node 24 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000. These commands work from the extracted project folder on Windows/WSL, macOS, and Linux.

For a production build:

```bash
npm run build
npm start
```

Demo mode needs no credentials. Metadata lives in `data/workspace.json`; originals live in `data/uploads`. Example documents are illustrative. Source preview retrieves actual excerpts without calling an LLM.

This is a single-owner local MVP. Scripts bind to loopback. Authentication, customer/internal roles, tenant isolation, and document ACLs are not implemented. Add those controls before exposing it on a network. Agent topic restrictions provide specialization, not tenant authorization.

## Features

- Persistent chat history, copy, source inspection, and downloads.
- Published-only retrieval with server-side specialist topic filters.
- Text-based PDFs with page references; Markdown, TXT, CSV, and pasted text.
- Images transcribed by a configured vision-capable model.
- Draft/publish workflow, document deletion, Qdrant indexing/reindexing.
- Editable specialist profiles, instructions, topic, and enabled state.
- Markdown, tables, and LaTeX math in answers.
- LangChain model and embedding adapters.
- OpenAI, OpenRouter, and OpenAI-compatible local model APIs.
- PostgreSQL, Qdrant, Azure Blob, and local file adapters.

## Connect a model

Copy `.env.example` to `.env.local`, configure your server variables, and restart Next.js. Never use `NEXT_PUBLIC_` for credentials.

| Provider | Server variables | Connections screen |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY` | Select OpenAI; enter supported model ID |
| OpenRouter | `OPENROUTER_API_KEY` | Select OpenRouter; enter `provider/model` |
| Local model | `LOCAL_LLM_BASE_URL`, optional `LOCAL_LLM_API_KEY` | Select Local model; enter loaded model ID |

A local base URL could be `http://127.0.0.1:8080/v1` for a correctly configured OpenAI-compatible server. It must be reachable from the machine running Next.js. Save preferences in Connections. Set `VISION_MODEL` to override the chat model for image transcription.

No key is included and no cloud fallback occurs. Local-only routing blocks cloud chat calls and requires `EMBEDDING_IS_LOCAL=true` for embeddings. Endpoint configuration is administrator-controlled.

## PostgreSQL

Run `database/postgresql.sql` on your PostgreSQL database, then configure:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/knowledge
DATABASE_DRIVER=pg
```

The optional `DATABASE_DRIVER=neon` uses Neon HTTP. Default `pg` supports ordinary PostgreSQL.

For a fresh local Docker setup:

```bash
docker compose up -d postgres
```

Compose initializes the schema. Its development credentials correspond to:

```dotenv
DATABASE_URL=postgresql://knowledge:local_development_only@127.0.0.1:5432/knowledge
DATABASE_DRIVER=pg
```

The MVP uses parameterized SQL with a JSON record table. Switching databases starts a separate workspace; it does not migrate existing data. The local file adapter is for a single process. Use PostgreSQL for concurrent/replicated deployments.

## Qdrant and embeddings

Qdrant stores/searches vectors; an embedding model creates them. Your chat model is not automatically an embedding model.

```dotenv
QDRANT_URL=http://127.0.0.1:6333
QDRANT_COLLECTION=knowledge
QDRANT_API_KEY=
EMBEDDING_BASE_URL=http://YOUR-EMBEDDING-SERVER/v1
EMBEDDING_MODEL=YOUR-EMBEDDING-MODEL
EMBEDDING_API_KEY=
EMBEDDING_IS_LOCAL=true
```

```bash
docker compose up -d qdrant
```

Configure an OpenAI-compatible embeddings endpoint. In Connections choose Qdrant vector search and save. Use each existing document's menu to index it. New uploads index automatically when vector search is selected. Failed indexing preserves the upload and reports an error.

The collection is created if absent. Use one embedding-model version per collection. Changing embedding models requires a new collection and reindexing, even if dimensions match. Keyword and vector search are separate modes; hybrid fusion and reranking are not implemented. Scores do not prove an answer is correct.

ONNX is optional and not installed/enabled. An ONNX-backed local embedding endpoint can later implement the same API. The browser downloads no ONNX model.

## Storage

Local files are the default. Override `LOCAL_DATA_PATH` and `LOCAL_STORAGE_PATH` if desired. Back up these directories.

For Azure Blob, configure a pre-created container and appropriately scoped server-side SAS:

```dotenv
AZURE_BLOB_CONTAINER_URL=https://ACCOUNT.blob.core.windows.net/CONTAINER
AZURE_BLOB_SAS_TOKEN=YOUR_SERVER_SIDE_SAS
```

The Azure adapter uses REST upload/download/delete operations and takes precedence over local files. It does not provision Azure resources or migrate existing originals. Credentials/SAS URLs stay on the server. Extracted passages remain in the application database.

## Ingestion

Choose Add knowledge or enter `/ingest` or `/knowledge add` in chat. Upload/paste, choose a topic, and publish or save as draft. Specialist topics match document topics exactly; `all` searches every published topic.

Limits: 5 MB uploads, 250,000 extracted characters, and 1 MB pasted text. This first version processes documents within the request. Large-scale queues, persistent background workers, automatic retries, document deduplication/version replacement, and scanned-PDF OCR are not implemented.

Image transcription requires a vision-capable model. Review formulas/symbols before publishing. No chemical-structure recognition or validated numerical calculation engine is included. Chat does not browse the web or execute arbitrary code.

Conversations retain source excerpts. Deleting a document prevents future retrieval but does not erase previously saved conversation excerpts; remove those conversations separately if needed. Model grounding instructions do not eliminate hallucination or prompt-injection risk.

## Source map

- `app/page.tsx`: chat, library, agents, and connections UI.
- `app/api/chat`: retrieval and model answering.
- `app/api/documents`: ingestion, publishing, indexing, deletion.
- `app/api/source`: original downloads.
- `lib/knowledge/gateway.ts`: LangChain adapters and routing.
- `lib/knowledge/retrieval.ts`: keyword/Qdrant search.
- `lib/knowledge/store.ts`: PostgreSQL/local metadata.
- `lib/knowledge/storage.ts`: original-file storage.
- `lib/knowledge/local-records.ts`: local JSON record persistence.
- `database/postgresql.sql`: schema.
- `compose.yaml`: optional local PostgreSQL/Qdrant.
- `tests/`: native API checks.

## Verification

```bash
npm run build
npm run test:smoke
npm run typecheck
```

The smoke runner starts a local production server with a temporary workspace, runs 12 checks, and cleans up. It verifies ingestion, PDF page references, draft exclusion, topic scoping, source downloads, saved conversations, and local-only policy.

The native production build and 12 API checks passed during delivery. External model APIs, PostgreSQL, Qdrant, Azure Blob, and vision ingestion were not live-tested because credentials/services were not provided. The UI received browser verification before the cloud browser was closed at your request; native build/API verification then ran without a browser.
