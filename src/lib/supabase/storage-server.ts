import { createAdminClient } from '@/utils/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export const STORAGE_BUCKET_NAMES = ['videos', 'thumbnails', 'resumes', 'avatars'] as const;
export type StorageBucketName = (typeof STORAGE_BUCKET_NAMES)[number];

/** 250 MB — matches Pro plan max upload */
const FILE_SIZE_LIMIT_BYTES = 262144000;

let adminBucketsEnsured = false;

export function getStorageConfigErrors(): string[] {
  const errors: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is missing.');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is missing (required for server uploads).');
  }
  return errors;
}

export async function ensureStorageBucketsAdmin(admin: SupabaseClient): Promise<void> {
  if (adminBucketsEnsured) return;

  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    throw new Error(`Could not list storage buckets: ${listError.message}`);
  }

  const existing = new Set((buckets ?? []).map((b) => b.id));

  for (const name of STORAGE_BUCKET_NAMES) {
    if (existing.has(name)) continue;

    const { error } = await admin.storage.createBucket(name, {
      public: true,
      fileSizeLimit: FILE_SIZE_LIMIT_BYTES,
    });

    if (error && !/already exists|duplicate/i.test(error.message)) {
      console.warn(`createBucket(${name}) warning:`, error.message);
    }
  }

  adminBucketsEnsured = true;
}

export async function uploadWithAdminStorage({
  bucket,
  path,
  data,
  contentType,
}: {
  bucket: StorageBucketName;
  path: string;
  data: Buffer;
  contentType: string;
}): Promise<string> {
  const admin = createAdminClient();
  if (!admin) {
    throw new Error(
      'Server storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment (Vercel → Settings → Environment Variables).'
    );
  }

  await ensureStorageBucketsAdmin(admin);

  const { error } = await admin.storage.from(bucket).upload(path, data, {
    upsert: true,
    contentType,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: urlData } = admin.storage.from(bucket).getPublicUrl(path);
  if (!urlData?.publicUrl) {
    throw new Error('Upload succeeded but public URL could not be generated.');
  }

  return urlData.publicUrl;
}
