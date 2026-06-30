import { createAdminClient } from '@/utils/supabase/admin';
import {
  syncAllStorageLimits,
  syncStorageBucketsAdmin,
} from '@/lib/supabase/sync-storage-limits';
import type { StorageBucketName } from '@/lib/upload-config';

export { syncAllStorageLimits, syncStorageBucketsAdmin };
export type { StorageBucketName };

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
  if (!process.env.SUPABASE_MANAGEMENT_TOKEN?.trim()) {
    errors.push(
      'SUPABASE_MANAGEMENT_TOKEN is missing (needed to raise the 50 MB Supabase global upload cap).'
    );
  }
  return errors;
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

  await syncAllStorageLimits(admin);

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
