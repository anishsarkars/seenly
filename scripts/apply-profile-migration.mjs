import pkg from '@next/env';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const { loadEnvConfig } = pkg;

loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1 });

const migrationPath = path.join(process.cwd(), 'drizzle', '0001_add_profile_columns.sql');
const migration = fs
  .readFileSync(migrationPath, 'utf8')
  .split('--> statement-breakpoint')
  .map((statement) => statement.trim())
  .filter(Boolean);

async function main() {
  for (const statement of migration) {
    console.log('Running:', statement.slice(0, 80).replace(/\s+/g, ' '), '...');
    await sql.unsafe(statement);
  }
  console.log('Migration applied successfully.');
  await sql.end();
}

main().catch(async (error) => {
  console.error('Migration failed:', error);
  await sql.end();
  process.exit(1);
});
