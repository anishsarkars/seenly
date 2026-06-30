import type { SupabaseClient } from '@supabase/supabase-js';
import { MAX_BUCKET_FILE_BYTES, formatBytesLimit } from '@/lib/storage-limits';
import { STORAGE_BUCKET_NAMES } from '@/lib/upload-config';

const SUPABASE_FREE_TIER_BYTES = 50 * 1024 * 1024;

type StorageFeatures = {
  imageTransformation?: { enabled?: boolean };
  s3Protocol?: { enabled?: boolean };
};

type StorageConfigResponse = {
  fileSizeLimit?: number;
  features?: StorageFeatures;
};

export type StorageSyncResult = {
  ok: boolean;
  limit?: number;
  skipped?: boolean;
  error?: string;
  projectRef?: string | null;
  confirmedLimit?: number | null;
};

export function getSupabaseProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname.split('.')[0] || null;
  } catch {
    return null;
  }
}

async function fetchStorageConfig(ref: string, token: string): Promise<StorageConfigResponse | null> {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/storage`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as StorageConfigResponse;
}

/** Sync Supabase project-wide storage limit (default is often 50 MB). */
export async function syncGlobalStorageLimit(): Promise<StorageSyncResult> {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN?.trim();
  const ref = getSupabaseProjectRef();

  if (!token || !ref) {
    return {
      ok: false,
      skipped: true,
      projectRef: ref,
      error: 'SUPABASE_MANAGEMENT_TOKEN not configured',
    };
  }

  try {
    const current = await fetchStorageConfig(ref, token);
    const body: StorageConfigResponse = {
      fileSizeLimit: MAX_BUCKET_FILE_BYTES,
      features: current?.features ?? {
        imageTransformation: { enabled: true },
      },
    };

    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/storage`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseText = await res.text().catch(() => '');
    if (!res.ok) {
      return {
        ok: false,
        projectRef: ref,
        error: responseText || `Management API returned ${res.status}`,
      };
    }

    let confirmedLimit: number | null = null;
    try {
      const parsed = JSON.parse(responseText) as StorageConfigResponse;
      confirmedLimit =
        typeof parsed.fileSizeLimit === 'number' ? parsed.fileSizeLimit : null;
    } catch {
      // PATCH may return empty body
    }

    if (confirmedLimit == null) {
      const after = await fetchStorageConfig(ref, token);
      confirmedLimit =
        typeof after?.fileSizeLimit === 'number' ? after.fileSizeLimit : null;
    }

    return {
      ok: true,
      limit: MAX_BUCKET_FILE_BYTES,
      projectRef: ref,
      confirmedLimit,
    };
  } catch (error) {
    return {
      ok: false,
      projectRef: ref,
      error: error instanceof Error ? error.message : 'Global storage sync failed',
    };
  }
}

export async function getGlobalStorageLimit(): Promise<number | null> {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN?.trim();
  const ref = getSupabaseProjectRef();
  if (!token || !ref) return null;

  const config = await fetchStorageConfig(ref, token);
  return typeof config?.fileSizeLimit === 'number' ? config.fileSizeLimit : null;
}

export async function getGlobalStorageLimitWithRetry(
  attempts = 6,
  delayMs = 1000
): Promise<number | null> {
  for (let i = 0; i < attempts; i++) {
    const limit = await getGlobalStorageLimit();
    if (limit != null) return limit;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
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

export function formatStorageCapacityError(
  fileSize: number,
  sync: StorageSyncResult,
  globalLimit: number | null,
  bucketLimit: number | null
): string {
  const fileMb = Math.round(fileSize / (1024 * 1024));
  const globalMb = globalLimit ? Math.round(globalLimit / (1024 * 1024)) : null;
  const bucketMb = bucketLimit ? Math.round(bucketLimit / (1024 * 1024)) : null;

  if (sync.skipped) {
    return (
      `Cannot upload ${fileMb} MB yet — Supabase storage is still capped at 50 MB. ` +
      `Add SUPABASE_MANAGEMENT_TOKEN to Vercel (Supabase → Account → Access Tokens), redeploy, then retry.`
    );
  }

  if (!sync.ok && sync.error) {
    const shortError = sync.error.slice(0, 200);
    return (
      `Cannot upload ${fileMb} MB — storage limit sync failed: ${shortError}. ` +
      `Check that SUPABASE_MANAGEMENT_TOKEN is a personal access token with project access, then redeploy.`
    );
  }

  if (globalLimit != null && globalLimit <= SUPABASE_FREE_TIER_BYTES && fileSize > globalLimit) {
    return (
      `Cannot upload ${fileMb} MB — your Supabase project storage is capped at ${globalMb} MB. ` +
      `Seenly Pro allows ${formatBytesLimit(MAX_BUCKET_FILE_BYTES)}, but Supabase must allow it too: open Supabase Dashboard → Storage → Settings → ` +
      `set Global file size limit to ${formatBytesLimit(MAX_BUCKET_FILE_BYTES)} (requires Supabase Pro plan on your Supabase project).`
    );
  }

  const effective = Math.min(
    bucketLimit ?? MAX_BUCKET_FILE_BYTES,
    globalLimit ?? MAX_BUCKET_FILE_BYTES
  );
  const effectiveMb = Math.round(effective / (1024 * 1024));

  return (
    `Cannot upload ${fileMb} MB — Supabase storage limit is ${effectiveMb} MB` +
    (globalMb ? ` (global: ${globalMb} MB` : '') +
    (bucketMb ? `${globalMb ? ', ' : ' ('}bucket: ${bucketMb} MB` : '') +
    `${globalMb || bucketMb ? ')' : ''}. ` +
    `Raise Supabase → Storage → Settings → Global file size limit to ${formatBytesLimit(MAX_BUCKET_FILE_BYTES)}.`
  );
}

export async function getEffectiveStorageLimit(
  admin: SupabaseClient,
  bucket: string,
  sync: StorageSyncResult,
  fileSize: number
): Promise<{ globalLimit: number | null; bucketLimit: number | null; effectiveLimit: number }> {
  const { data: bucketInfo } = await admin.storage.getBucket(bucket);
  const bucketLimit = bucketInfo?.file_size_limit ?? null;
  const globalLimit = await getGlobalStorageLimitWithRetry(sync.ok ? 6 : 2, sync.ok ? 1000 : 500);

  if (sync.ok && fileSize <= MAX_BUCKET_FILE_BYTES) {
    const confirmed = sync.confirmedLimit ?? globalLimit;
    if (confirmed == null || confirmed >= fileSize) {
      return {
        globalLimit: confirmed ?? globalLimit,
        bucketLimit,
        effectiveLimit: MAX_BUCKET_FILE_BYTES,
      };
    }
  }

  const effectiveLimit = Math.min(
    bucketLimit ?? MAX_BUCKET_FILE_BYTES,
    globalLimit ?? SUPABASE_FREE_TIER_BYTES
  );

  return { globalLimit, bucketLimit, effectiveLimit };
}

export async function assertStorageCanAcceptUpload(
  admin: SupabaseClient,
  bucket: string,
  fileSize: number,
  sync: StorageSyncResult
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { globalLimit, bucketLimit, effectiveLimit } = await getEffectiveStorageLimit(
    admin,
    bucket,
    sync,
    fileSize
  );

  if (fileSize <= effectiveLimit) {
    return { ok: true };
  }

  if (sync.ok && fileSize <= MAX_BUCKET_FILE_BYTES) {
    const confirmed = sync.confirmedLimit ?? globalLimit;
    if (confirmed == null || confirmed >= fileSize) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    message: formatStorageCapacityError(fileSize, sync, globalLimit, bucketLimit),
  };
}

/** Full storage sync: global project limit + per-bucket limits. */
export async function syncAllStorageLimits(admin: SupabaseClient): Promise<StorageSyncResult> {
  const global = await syncGlobalStorageLimit();
  if (!global.ok && !global.skipped) {
    console.warn('Global storage limit sync failed:', global.error);
  }
  await syncStorageBucketsAdmin(admin);

  if (global.ok && global.confirmedLimit != null && global.confirmedLimit < MAX_BUCKET_FILE_BYTES) {
    console.warn(
      `Global storage limit is ${global.confirmedLimit} bytes after sync; expected ${MAX_BUCKET_FILE_BYTES}. ` +
        'Supabase project may be on the Free plan (50 MB max).'
    );
    global.ok = false;
    global.error = `Supabase confirmed limit is ${global.confirmedLimit} bytes (50 MB cap on Free plan)`;
  }

  return global;
}
