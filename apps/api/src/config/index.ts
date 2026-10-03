import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from apps/api/.env or process.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/api/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config(); // fallback to default location

export interface AppConfig {
  env: string;
  port: number;
  databaseUrl: string;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.warn('⚠️ WARNING: DATABASE_URL environment variable is not defined.');
}

export const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: databaseUrl || 'postgresql://postgres:postgres@127.0.0.1:5432/blog_management_dev?schema=public',
};
