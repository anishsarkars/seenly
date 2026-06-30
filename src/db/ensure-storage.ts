import { sql } from 'drizzle-orm';
import { db } from './index';

let storageEnsured = false;

function isDbAvailable() {
  return !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-supabase');
}

const BUCKETS = ['videos', 'thumbnails', 'resumes', 'avatars'] as const;

const STORAGE_POLICIES = [
  `CREATE POLICY "Public read videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos')`,
  `CREATE POLICY "Public read thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails')`,
  `CREATE POLICY "Public read resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes')`,
  `CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars')`,
  `CREATE POLICY "Users upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users upload thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users upload resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users update videos" ON storage.objects FOR UPDATE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users update thumbnails" ON storage.objects FOR UPDATE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users update resumes" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users delete videos" ON storage.objects FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users delete thumbnails" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users delete resumes" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1])`,
  `CREATE POLICY "Users delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])`,
] as const;

export async function ensureStorageBuckets() {
  if (!isDbAvailable()) return;

  for (const bucket of BUCKETS) {
    try {
      await db.execute(sql`
        INSERT INTO storage.buckets (id, name, public, file_size_limit)
        VALUES (${bucket}, ${bucket}, true, 262144000)
        ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 262144000
      `);
    } catch (error) {
      console.warn(`Bucket ensure skipped for ${bucket}:`, error);
    }
  }

  for (const policy of STORAGE_POLICIES) {
    try {
      await db.execute(sql.raw(policy));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already exists') && !message.includes('duplicate')) {
        console.warn('Storage policy skipped:', message);
      }
    }
  }

  storageEnsured = true;
}

export async function ensureStorageReady() {
  if (storageEnsured) return;
  await ensureStorageBuckets();
}
