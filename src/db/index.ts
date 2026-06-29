import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

// For edge environments or serverless, disable prefetch
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
