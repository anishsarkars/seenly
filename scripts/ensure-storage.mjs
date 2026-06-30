import pkg from '@next/env';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const { loadEnvConfig } = pkg;
loadEnvConfig(process.cwd());

const dbUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const buckets = ['videos', 'thumbnails', 'resumes', 'avatars'];
const FILE_SIZE_LIMIT = 262144000;

async function ensureViaSql() {
  if (!dbUrl) {
    console.warn('DATABASE_URL not set — skipping SQL bucket setup.');
    return;
  }
  const client = postgres(dbUrl, { ssl: 'require', max: 1 });
  try {
    for (const bucket of buckets) {
      await client`
        INSERT INTO storage.buckets (id, name, public, file_size_limit)
        VALUES (${bucket}, ${bucket}, true, ${FILE_SIZE_LIMIT})
        ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = ${FILE_SIZE_LIMIT}
      `;
      console.log(`SQL ensured bucket: ${bucket}`);
    }
    const rows = await client`SELECT id, public, file_size_limit FROM storage.buckets ORDER BY id`;
    console.log('Buckets in DB:', rows);
  } finally {
    await client.end();
  }
}

async function ensureViaApi() {
  if (!supabaseUrl || !serviceKey) {
    console.warn('Supabase URL or SERVICE_ROLE_KEY not set — skipping API bucket setup.');
    return;
  }
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: existing, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    console.error('listBuckets failed:', listError.message);
    return;
  }
  const ids = new Set((existing ?? []).map((b) => b.id));
  for (const name of buckets) {
    if (!ids.has(name)) {
      const { error } = await admin.storage.createBucket(name, {
        public: true,
        fileSizeLimit: FILE_SIZE_LIMIT,
      });
      if (error) {
        console.error(`createBucket(${name}) failed:`, error.message);
      } else {
        console.log(`API created bucket: ${name}`);
      }
    }

    const { error: updateError } = await admin.storage.updateBucket(name, {
      public: true,
      fileSizeLimit: FILE_SIZE_LIMIT,
    });
    if (updateError) {
      console.error(`updateBucket(${name}) failed:`, updateError.message);
    } else {
      console.log(`API synced bucket limit: ${name} → ${FILE_SIZE_LIMIT}`);
    }
  }
}

async function main() {
  await ensureViaSql();
  await ensureViaApi();
  console.log('Storage setup complete.');
}

main().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
