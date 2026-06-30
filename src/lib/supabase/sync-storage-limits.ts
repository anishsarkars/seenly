import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_BUCKET_FILE_BYTES } from '@/lib/storage-limits';
import { STORAGE_BUCKET_NAMES } from '@/lib/upload-config';

export function getSupabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname.split('.')[0] || null;
  } catch {
    return null;
  }
}

/** Sync Supabase project-wide storage limit (default is often 50 MB). */
export async function syncGlobalStorageLimit(): Promise<{
  ok: boolean;
  limit?: number;
  skipped?: boolean;
  error?: string;
}> {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN?.trim();
  const ref = getSupabaseProjectRef();

  if (!token || !ref) {
    return { ok: false, skipped: true, error: 'SUPABASE_MANAGEMENT_TOKEN not configured' };
  }

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/storage`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileSizeLimit: MAX_BUCKET_FILE_BYTES }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: text || `Management API returned ${res.status}` };
    }

    return { ok: true, limit: MAX_BUCKET_FILE_BYTES };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Global storage sync failed',
    };
  }
}

export async function getGlobalStorageLimit(): Promise<number | null> {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN?.trim();
  const ref = getSupabaseProjectRef();
  if (!token || !ref) return null;

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/storage`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { fileSizeLimit?: number };
    return typeof data.fileSizeLimit === 'number' ? data.fileSizeLimit : null;
  } catch {
    return null;
  }
}

export async function syncStorageBucketsAdmin(admin: SupabaseClient): Promise<void> {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();
  if (listError) {
    throw new Error(`Could not list storage buckets: ${listError.message}`);
  }

  const existing = new Set((buckets ?? []).map((b) => b.id));

  for (const name of STORAGE_BUCKET_NAMES) {
    if (!existing.has(name)) {
      const { error } = await admin.storage.createBucket(name, {
        public: true,
        fileSizeLimit: MAX_BUCKET_FILE_BYTES,
      });
      if (error && !/already exists|duplicate/i.test(error.message)) {
        console.warn(`createBucket(${name}) warning:`, error.message);
      }
    }

    const { error: updateError } = await admin.storage.updateBucket(name, {
      public: true,
      fileSizeLimit: MAX_BUCKET_FILE_BYTES,
    });

    if (updateError) {
      console.warn(`updateBucket(${name}) warning:`, updateError.message);
    }
  }
}

export async function verifyBucketCanAccept(
  admin: SupabaseClient,
  bucket: string,
  fileSize: number
): Promise<{ ok: true } | { ok: false; bucketLimit: number | null; message: string }> {
  const { data: bucketInfo, error } = await admin.storage.getBucket(bucket);
  if (error || !bucketInfo) {
    return {
      ok: false,
      bucketLimit: null,
      message: `Storage bucket "${bucket}" is not available.`,
    };
  }

  const bucketLimit = bucketInfo.file_size_limit ?? null;
  const global = await getGlobalStorageLimit();
  const effectiveLimit = Math.min(
    bucketLimit ?? MAX_BUCKET_FILE_BYTES,
    global ?? MAX_BUCKET_FILE_BYTES
  );

  if (fileSize > effectiveLimit) {
    const globalMb = global ? Math.round(global / (1024 * 1024)) : 50;
    return {
      ok: false,
      bucketLimit: bucketLimit,
      message:
        `File is too large for storage (${Math.round(fileSize / (1024 * 1024))} MB). ` +
        `Bucket limit is ${Math.round(effectiveLimit / (1024 * 1024))} MB` +
        (global ? ` and project global limit is ${globalMb} MB.` : '.') +
        ` Set Supabase → Storage → Settings → Global file size limit to at least 250 MB, ` +
        `or add SUPABASE_MANAGEMENT_TOKEN to Vercel to auto-sync.`,
    };
  }

  return { ok: true };
}

/** Full storage sync: global project limit + per-bucket limits. */
export async function syncAllStorageLimits(admin: SupabaseClient) {
  const global = await syncGlobalStorageLimit();
  if (!global.ok && !global.skipped) {
    console.warn('Global storage limit sync failed:', global.error);
  }
  await syncStorageBucketsAdmin(admin);
  return global;
}
