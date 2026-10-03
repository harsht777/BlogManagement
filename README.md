# Blog Management Admin Panel

A full-stack, DOCX-based blog management, AST parsing, preview, and publishing system built with **Next.js**, **Apollo GraphQL**, **Node.js**, **Prisma ORM**, and **PostgreSQL**.

---

## 1. Project Purpose
The Blog Management Admin Panel enables administrators to upload `.doc` / `.docx` files containing blog content and semantic structures. The system extracts document elements (headings, paragraphs, lists, images, quotes/callouts, tables), normalizes them into a structured `BlogDocumentAST`, maps them to a reusable web template matching the Kofuku design specification, and provides a real-time split editor, preview, and publishing workflow.

---

## 2. Key Features

- 📄 **DOCX Document Ingestion:** Parsing engine built on Mammoth, fast-xml-parser, officeparser, and adm-zip for complete OpenXML element extraction.
- 🌳 **Structured BlogDocumentAST:** Typed JSON representation supporting headings, paragraphs with inline styles (bold, italic, links), ordered/unordered lists, blockquotes/callouts, tables with dynamic cell grid editing, and inline/featured images.
- 🖼️ **Image Extraction & Static Serving:** Embedded images are extracted, hashed via SHA-256 for deduplication, saved to local persistent storage (`storage/images`), and served statics via Express & Next.js.
- ⚡ **Apollo GraphQL API:** Strongly-typed schema providing mutations for document upload, AST editing, title/excerpt updates, publish/unpublish lifecycle, and blog deletion.
- 🎨 **Kofuku Blog Renderer:** Reusable, pixel-perfect blog renderer with inline text spacing preservation, dynamic table rendering, responsive typography, and hero header formatting.
- ✏️ **Split Desktop Workspace Editor:** Real-time 40/60 split-pane workspace with structured AST editor on the left and instant live preview on the right.
- 🚀 **Single-Command Local Stack:** Start PostgreSQL 17, Apollo GraphQL Server (port 4000), and Next.js Web App (port 3000) with a single `npm run dev` command.
- 🐳 **Full Docker Compose Deployment:** Portable, production-ready containerization via `docker-compose.yml` for PostgreSQL, API, and Web services with data & image volume persistence.

---

## 3. Architecture & Data Flow

```
+-------------------------------------------------------------------------+
|                        Browser / Client                                 |
|                     http://localhost:3000                               |
+-------------------------------------------------------------------------+
                                     |
                                     | Apollo Client (GraphQL over HTTP)
                                     v
+-------------------------------------------------------------------------+
|                Next.js Admin & Public Web App (apps/web)                |
|                    Port 3000 (React 19 / App Router)                    |
+-------------------------------------------------------------------------+
                                     |
                                     | GraphQL Requests / Queries / Mutations
                                     v
+-------------------------------------------------------------------------+
|                 Apollo GraphQL Server Backend (apps/api)                |
|                    Port 4000 (Node.js / Express)                        |
+-------------------------------------------------------------------------+
                  |                                     |
    Prisma ORM    |                                     | File I/O
                  v                                     v
+-----------------------------------+   +---------------------------------+
|       PostgreSQL Database         |   |      Local Image Storage        |
|  127.0.0.1:5432 / postgres:5432   |   |   /storage/images (Static)      |
|     (blog_management_dev)         |   +---------------------------------+
+-----------------------------------+
```

---

## 4. Directory Structure

```
Blog_Management/
│
├── apps/
│   ├── web/                     # Next.js App Router frontend
│   │   ├── app/                 # Admin panel, public blog pages, image route handlers
│   │   ├── components/          # Reusable UI components & Kofuku renderer
│   │   ├── lib/                 # Apollo Client setup
│   │   ├── Dockerfile           # Multi-stage Web container setup
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                     # Node.js + Apollo Server backend
│       ├── src/
│       │   ├── config/          # Environment & server config
│       │   ├── graphql/         # Schema (typeDefs) & Resolvers
│       │   ├── services/        # Ingest, Parser, Normalizer, Image, & Blog Services
│       │   ├── lib/             # Prisma client instance & DB utilities
│       │   └── server.ts        # Apollo Server & static image entrypoint
│       │
│       ├── prisma/
│       │   ├── schema.prisma    # PostgreSQL Prisma schema
│       │   ├── seed.ts          # Seed script for development test data
│       │   └── migrations/      # Version-controlled database migrations
│       │
│       ├── Dockerfile           # Production API container setup
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                        # Architecture, decisions, and requirement docs
│   ├── requirements/            # Manager requirements reference
│   ├── architecture/            # Architecture phase documentations
│   └── decisions/               # Architecture Decision Records (ADRs)
│
├── sample-documents/            # Verification DOCX test documents and JSON snapshots
├── storage/                     # Persistent storage directory
│   ├── documents/               # Source document storage
│   ├── images/                  # Extracted static image assets
│   └── temp/                    # Temporary upload buffer directory
│
├── scripts/                     # Automation, test runners, and stack launcher
├── docker-compose.yml           # Monorepo container orchestration
├── .dockerignore
├── .editorconfig
├── .env.example
├── .gitignore
├── package.json                 # Monorepo root workspace configuration
└── README.md                    # Root single source of documentation
```

---

## 5. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Apollo Client, Tailwind CSS |
| **Backend API** | Node.js, Apollo Server 4, Express 4, GraphQL, TypeScript |
| **Document Parsing** | Mammoth, fast-xml-parser, officeparser, adm-zip |
| **ORM & Database** | Prisma ORM 6, PostgreSQL 17 (`blog_management_dev`) |
| **Containerization** | Docker, Docker Compose, Alpine Linux images |
| **Workspace Manager** | npm Workspaces (monorepo root) |

---

## 6. Quickstart Guide

### Option A: Full Docker Compose Deployment (Recommended)

To run the complete application inside isolated containers:

```bash
# 1. Build and start all services (PostgreSQL, API, Web)
docker compose up --build

# 2. Access the Web application in your browser:
#    http://localhost:3000

# 3. Stop containers safely when finished:
docker compose down
```

---

### Option B: Local Non-Docker Development

To run the application locally on your machine:

#### Prerequisites
- Node.js `v20+` or `v24+`
- npm `10+` or `11+`
- PostgreSQL `17` installed locally on port `5432`

#### Setup & Launch
1. Ensure `.env` or `apps/api/.env` is configured (defaults to local PostgreSQL superuser `postgres`).
2. Run the single-command launcher from the project root:
   ```bash
   npm run dev
   ```
   *The script automatically checks PostgreSQL 17, starts it if stopped, verifies database connectivity, launches Apollo API on port 4000, and starts Next.js Web on port 3000.*

3. Open `http://localhost:3000` in your browser.

---

## 7. Application URLs & Verification Endpoints

| Resource | Service / URL |
| :--- | :--- |
| **Web Admin Panel & Editor** | [`http://localhost:3000/admin`](http://localhost:3000/admin) |
| **Public Blog Page** | [`http://localhost:3000/blog/<id>`](http://localhost:3000/blog/id) |
| **GraphQL Explorer & Endpoint** | [`http://localhost:4000/graphql`](http://localhost:4000/graphql) |
| **Static Extracted Images** | [`http://localhost:4000/storage/images/<filename>`](http://localhost:4000/storage/images/) |

---

## 8. Environment Variables

| Variable Name | Context | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | API / Prisma | `postgresql://postgres:postgres@localhost:5432/blog_management_dev?schema=public` | PostgreSQL connection string. (Inside Docker: host is `postgres:5432`) |
| `PORT` | API Server | `4000` | Port for Express + Apollo GraphQL server. |
| `NEXT_PUBLIC_GRAPHQL_URL` | Web Client | `http://localhost:4000/graphql` | GraphQL endpoint URL invoked by browser Apollo Client. |

---

## 9. Data Persistence Strategy

1. **PostgreSQL Database:**
   - **Docker:** Data persists in the named volume `postgres_data`.
   - **Local:** Data persists in `C:\PostgreSQL\17\data`.
   - Automatic migrations are applied on startup via `npx prisma migrate deploy` without wiping data.

2. **Extracted Image Assets:**
   - Saved to `/storage/images/` on disk with SHA-256 content hash filenames.
   - **Docker:** Mapped via host volume `./storage:/app/storage` shared between `api` and `web` containers. Images survive container rebuilds and restarts.

3. **Uploaded Documents:**
   - Temporary uploads are stored in `/storage/temp/` during buffer parsing and cleaned up immediately after ingestion.

---

## 10. Automated Verification Suites

Run test suites from the project root:

```bash
# Typecheck across all monorepo workspaces
npm run typecheck

# Production build across all monorepo workspaces
npm run build

# Phase 3A: Core DOCX Parsing & AST Normalizer
npm run test:parser

# Phase 3B: Blog Persistence & GraphQL Operations
npm run test:persistence

# Phase 4B: Real Document Upload & Buffer Ingestion
npm run test:upload

# Phase 4C: AST Editor & Metadata Persistence
npm run test:editor

# Phase 4D: Kofuku Renderer & Public Blog Page
npm run test:renderer

# Phase 4E: Publish/Unpublish/Delete Lifecycle
npm run test:lifecycle
```

---

## 11. PostgreSQL Operations (Local Standalone)

- **Check Status:** `pg_ctl -D "C:\PostgreSQL\17\data" status`
- **Start Service:** `pg_ctl -D "C:\PostgreSQL\17\data" -l "C:\PostgreSQL\17\data\server.log" start`
- **Stop Service:** `pg_ctl -D "C:\PostgreSQL\17\data" stop`
- **CLI Connection:** `psql -U postgres -h 127.0.0.1 -p 5432 -d blog_management_dev`

---

## 12. Troubleshooting & Common Issues

- **Port 5432, 4000, or 3000 already in use:**
  If running `docker compose up` while local Node processes or standalone PostgreSQL are running, stop local processes first or ensure ports are free.
- **Docker Compose build errors:**
  Ensure Docker Desktop is running and execute `docker compose build --no-cache`.
- **Database Connection Failure in Docker:**
  The `api` container waits for the `postgres` healthcheck. If Postgres fails to start, verify named volume permissions.
