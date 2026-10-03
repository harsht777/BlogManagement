# ADR 001: Project Structure and Monorepo Strategy

## Status
Accepted

## Context
The **Blog Management Admin Panel** project consists of a Next.js frontend and a Node.js GraphQL backend. The system requires an organized codebase that allows frontend and backend to develop independently while maintaining unified script orchestration, consistent dependencies, and shared documentation.

## Decision

1. **Monorepo with npm Workspaces:**
   We use standard npm workspaces (`apps/web` and `apps/api`) at the repository root. This avoids complex monorepo tooling (like Turborepo or Nx) while providing centralized script management (`npm run dev`, `npm run build`, `npm run typecheck`).

2. **Decoupled Backend (`apps/api`):**
   The backend is built as an independent Node.js application running Apollo Server and Prisma ORM, entirely separated from Next.js. We explicitly do NOT use Next.js internal API routes or Server Actions for core business logic, adhering to the manager's architecture requirements.

3. **Decoupled Frontend (`apps/web`):**
   The frontend is a dedicated Next.js App Router application communicating with the backend exclusively via GraphQL over HTTP using Apollo Client.

4. **Dedicated Documentation and Storage Directories:**
   - `docs/requirements/`: Traceable manager requirement documents.
   - `docs/architecture/`: System design, data flow diagrams, and component specs.
   - `docs/decisions/`: Architecture Decision Records (ADRs).
   - `docs/setup/`: Development environment instructions and guides.
   - `sample-documents/`: Reserved for sample `.docx` files during Phase 2.
   - `storage/`: Reserved for local storage (`documents/` and `images/`).

5. **Simplicity and Pragmatism:**
   We intentionally avoid unnecessary infrastructure, Docker containers, Redis, microservices, and shared internal npm packages during Phase 1.

## Consequences

- **Positive:** Clear separation of concerns, fast setup, lightweight tooling, fully reproducible locally.
- **Negative:** Requires running two separate development servers (`web` on 3000, `api` on 4000) during local development (managed via unified npm scripts).
