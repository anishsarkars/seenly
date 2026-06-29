import pkg from '@next/env';
import postgres from 'postgres';

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const sql = postgres(url, { ssl: 'require', max: 1 });
const buckets = ['videos', 'thumbnails', 'resumes', 'avatars'];

async function main() {
  for (const bucket of buckets) {
    await sql`
      INSERT INTO storage.buckets (id, name, public, file_size_limit)
      VALUES (${bucket}, ${bucket}, true, 157286400)
      ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 157286400
    `;
    console.log(`Ensured bucket: ${bucket}`);
  }

  const existing = await sql`SELECT id, public FROM storage.buckets ORDER BY id`;
  console.log('Buckets:', existing);
  await sql.end();
}

main().catch(async (error) => {
  console.error('Failed:', error);
  await sql.end();
  process.exit(1);
});
