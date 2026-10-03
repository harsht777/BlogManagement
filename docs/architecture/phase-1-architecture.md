# Phase 1 Architecture Overview

## Objective
The goal of Phase 1 is to establish a clean, modular, and type-safe local foundation that connects the full request-response lifecycle from the Next.js frontend to PostgreSQL through GraphQL and Prisma.

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / Client                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js (apps/web)                      │
│                  - React (App Router)                       │
│                  - TypeScript                               │
│                  - Apollo Client                            │
└──────────────────────────────┬──────────────────────────────┘
                               │ GraphQL Queries over HTTP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Node.js Backend (apps/api)                    │
│                  - Apollo Server                            │
│                  - GraphQL Schema & Resolvers               │
│                  - Service Layer (BlogService)              │
│                  - Prisma Client                            │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQL (via Prisma Engine)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             PostgreSQL Database (localhost:5432)            │
│               - Database: blog_management_dev               │
│               - Model: Blog (id, title, status, timestamps) │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### 1. Frontend Layer (`apps/web`)
- **Technology:** Next.js (App Router), React, TypeScript.
- **Data Fetching:** Apollo Client configured for App Router client/server queries.
- **Responsibility:** Renders the web interface and requests data via GraphQL operations (`health`, `blogs`).

### 2. API / GraphQL Layer (`apps/api/src/graphql`)
- **Technology:** Apollo Server, GraphQL (`graphql` package).
- **Responsibility:** Exposes strongly typed GraphQL schema (`typeDefs`) and resolves operations through modular resolver functions.
- **Decoupling:** Resolvers do not query the database directly; they delegate all business and data operations to the service layer.

### 3. Service Layer (`apps/api/src/services`)
- **Technology:** TypeScript Service classes (`BlogService`).
- **Responsibility:** Encapsulates domain logic, validation, and data orchestration. Uses the Prisma Client instance to interact with the database.

### 4. Data Access Layer (`apps/api/src/lib/prisma.ts` & `prisma/schema.prisma`)
- **Technology:** Prisma ORM (Client & CLI).
- **Responsibility:** Manages the schema definition, migrations, and database connection pooling.

### 5. Persistence Layer (`PostgreSQL`)
- **Technology:** PostgreSQL 17.11 running on `localhost:5432`.
- **Database:** `blog_management_dev`.
- **Responsibility:** Stores persistent data with referential integrity and ACID guarantees.

---

## End-to-End Data Flow

```
1. Browser opens http://localhost:3000
2. Next.js page component triggers GraphQL Query:
   query GetBlogs {
     health
     blogs {
       id
       title
       status
       createdAt
     }
   }
3. Apollo Client sends HTTP POST to http://localhost:4000/graphql
4. Apollo Server parses query and executes resolvers (Query.health, Query.blogs)
5. Query.blogs calls BlogService.getAllBlogs()
6. BlogService queries Prisma: prisma.blog.findMany()
7. Prisma executes SQL SELECT on PostgreSQL (blog_management_dev.Blog table)
8. PostgreSQL returns rows to Prisma
9. Prisma hydrates typed TypeScript objects to BlogService
10. BlogService passes data to GraphQL resolver
11. Apollo Server serializes response to JSON
12. Apollo Client receives data and updates React state
13. Next.js renders the live database-backed blog data in the browser
```

---

## Traceability: Requirements vs. Implementation

| Architectural Element | Origin | Rationale |
| :--- | :--- | :--- |
| **Separate `apps/web` and `apps/api`** | Manager Requirement & Prompt | Independent backend API decoupled from Next.js server runtime. |
| **GraphQL / Apollo Server** | Manager Requirement | Central strongly-typed query layer as required by the manager. |
| **Prisma ORM + PostgreSQL** | Manager Requirement | Type-safe database client and migration source of truth. |
| **Minimal `Blog` Model (Phase 1)** | Phase 1 Decision | Proves end-to-end database connectivity without speculative fields. |
| **npm Workspaces Monorepo** | Implementation Decision | Unified package management and scripts without heavyweight tooling. |
| **No Docker in Phase 1** | Explicit Prompt & Manager | Containerization deferred until all local features are built. |
