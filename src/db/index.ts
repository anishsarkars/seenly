import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';
const useSsl =
  connectionString.includes('supabase.co') ||
  connectionString.includes('pooler.supabase.com');

// For Supabase serverless, disable prefetch and require SSL in production.
const client = postgres(connectionString, {
  prepare: false,
  ssl: useSsl ? 'require' : undefined,
  max: 10,
});

export const db = drizzle(client, { schema });
