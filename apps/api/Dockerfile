FROM node:24-alpine

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root workspace and package definitions
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Install workspace dependencies
RUN npm ci

# Copy shared package and API workspace source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package types and module output
RUN npm run build --workspace=@blog-management/shared

# Change directory to API workspace for build steps
WORKDIR /app/apps/api

# Generate Prisma Client for PostgreSQL
RUN npx prisma generate

# Compile TypeScript to JavaScript in dist/
RUN npm run build

# Expose Apollo GraphQL server port
EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

# Apply pending database migrations safely without wiping data, then launch API server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
