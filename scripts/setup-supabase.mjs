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

async function main() {
  const setupPath = path.join(process.cwd(), 'supabase', 'setup.sql');
  const setup = fs.readFileSync(setupPath, 'utf8');

  // Run statement-by-statement; ignore duplicate policy errors.
  const chunks = setup
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith('--'));

  for (const chunk of chunks) {
    const statement = chunk.endsWith(';') ? chunk : `${chunk};`;
    try {
      console.log('Running:', statement.slice(0, 90).replace(/\s+/g, ' '), '...');
      await sql.unsafe(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('already exists') || message.includes('duplicate')) {
        console.log('Skipped (already exists).');
        continue;
      }
      console.warn('Warning:', message);
    }
  }

  console.log('Supabase setup applied.');
  await sql.end();
}

main().catch(async (error) => {
  console.error('Setup failed:', error);
  await sql.end();
  process.exit(1);
});
