# Multi-stage Dockerfile for Next.js Web App

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root workspace and package definitions
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

# Install build dependencies
RUN npm ci

# Copy shared package and Web workspace source code
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build shared package types and module output
RUN npm run build --workspace=@blog-management/shared

# Build argument for GraphQL API endpoint (accessible by browser client)
ARG NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
ENV NEXT_PUBLIC_GRAPHQL_URL=$NEXT_PUBLIC_GRAPHQL_URL

# Build Next.js application for production
WORKDIR /app/apps/web
RUN npm run build

# Stage 2: Production Runner
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package definitions for root monorepo
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

# Install dependencies needed for Next.js runtime
RUN npm ci

# Copy built application assets, shared package, and web source from builder stage
COPY packages/shared ./packages/shared
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY apps/web ./apps/web

WORKDIR /app/apps/web

EXPOSE 3000

# Start Next.js production server on port 3000
CMD ["npm", "run", "start"]
