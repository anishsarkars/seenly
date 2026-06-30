import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getStorageConfigErrors, getStorageConfigWarnings, syncAllStorageLimits } from '@/lib/supabase/storage-server';
import { getGlobalStorageLimit } from '@/lib/supabase/sync-storage-limits';
import { MAX_BUCKET_FILE_BYTES } from '@/lib/storage-limits';
import { STORAGE_BUCKET_NAMES } from '@/lib/upload-config';

/** Diagnostic: verify storage env + buckets (admin only). */
export async function GET() {
  const configErrors = getStorageConfigErrors();
  const configWarnings = getStorageConfigWarnings();
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({
      ok: false,
      configErrors,
      configWarnings,
      buckets: [],
      globalFileSizeLimit: null,
      message: 'Add SUPABASE_SERVICE_ROLE_KEY to enable uploads.',
    });
  }

  try {
    const globalSync = await syncAllStorageLimits(admin);
    const globalFileSizeLimit = await getGlobalStorageLimit();
    const bucketDetails = [];

    for (const id of STORAGE_BUCKET_NAMES) {
      const { data: bucket, error: bucketError } = await admin.storage.getBucket(id);
      if (bucketError || !bucket) {
        bucketDetails.push({ id, public: false, fileSizeLimit: null, ok: false });
        continue;
      }
      const limit = bucket.file_size_limit ?? null;
      bucketDetails.push({
        id,
        public: bucket.public,
        fileSizeLimit: limit,
        ok: limit == null || limit >= MAX_BUCKET_FILE_BYTES,
      });
    }

    const missing = bucketDetails.filter((b) => !b.ok).map((b) => b.id);
    const limitsOk = bucketDetails.length === STORAGE_BUCKET_NAMES.length && bucketDetails.every((b) => b.ok);
    const globalOk =
      globalFileSizeLimit == null || globalFileSizeLimit >= MAX_BUCKET_FILE_BYTES;

    return NextResponse.json({
      ok: missing.length === 0 && limitsOk && globalOk && configErrors.length === 0,
      configErrors,
      configWarnings,
      buckets: bucketDetails,
      missing,
      requiredBucketLimit: MAX_BUCKET_FILE_BYTES,
      globalFileSizeLimit,
      globalSync,
      globalOk,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configErrors,
        configWarnings,
        error: error instanceof Error ? error.message : 'Storage check failed',
      },
      { status: 500 }
    );
  }
}
