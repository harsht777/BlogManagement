import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/schema/typeDefs.js';
import { resolvers } from './graphql/resolvers/index.js';
import { config } from './config/index.js';
import { testDatabaseConnection } from './lib/prisma.js';

async function startServer(): Promise<void> {
  console.log('🚀 Initializing Blog Management API Server...');

  const dbOk = await testDatabaseConnection();
  if (!dbOk) {
    console.warn('⚠️ Warning: Database connection check failed on startup. Please ensure PostgreSQL is running.');
  } else {
    console.log('✅ Connected to PostgreSQL database (blog_management_dev).');
  }

  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  // Resolve root storage/images directory safely
  const cwd = process.cwd();
  const storageImagesDir = cwd.endsWith('apps\\api') || cwd.endsWith('apps/api')
    ? path.resolve(cwd, '..', '..', 'storage', 'images')
    : path.resolve(cwd, 'storage', 'images');

  if (!fs.existsSync(storageImagesDir)) {
    fs.mkdirSync(storageImagesDir, { recursive: true });
  }

  // Serve extracted image files from /storage/images
  app.use('/storage/images', express.static(storageImagesDir));

  // GraphQL Apollo Server Express Middleware
  app.use(
    '/',
    cors<cors.CorsRequest>(),
    express.json({ limit: '30mb' }),
    expressMiddleware(server)
  );

  await new Promise<void>((resolve) => httpServer.listen({ port: config.port }, resolve));

  console.log(`🚀 Blog Management GraphQL Server ready at: http://localhost:${config.port}/`);
  console.log(`🖼️ Static Image Storage ready at: http://localhost:${config.port}/storage/images/`);
}

startServer().catch((err: unknown) => {
  console.error('❌ Failed to start GraphQL Server:', err);
  process.exit(1);
});
