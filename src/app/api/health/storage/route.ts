import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getStorageConfigErrors, syncStorageBucketsAdmin } from '@/lib/supabase/storage-server';
import { MAX_BUCKET_FILE_BYTES } from '@/lib/storage-limits';

/** Diagnostic: verify storage env + buckets (admin only). */
export async function GET() {
  const configErrors = getStorageConfigErrors();
  const admin = createAdminClient();

  if (!admin) {
    return NextResponse.json({
      ok: false,
      configErrors,
      buckets: [],
      message: 'Add SUPABASE_SERVICE_ROLE_KEY to enable uploads.',
    });
  }

  try {
    await syncStorageBucketsAdmin(admin);
    const required = ['videos', 'thumbnails', 'resumes', 'avatars'] as const;
    const bucketDetails = [];

    for (const id of required) {
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
    const limitsOk = bucketDetails.length === required.length && bucketDetails.every((b) => b.ok);

    return NextResponse.json({
      ok: missing.length === 0 && limitsOk && configErrors.length === 0,
      configErrors,
      buckets: bucketDetails,
      missing,
      requiredBucketLimit: MAX_BUCKET_FILE_BYTES,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        configErrors,
        error: error instanceof Error ? error.message : 'Storage check failed',
      },
      { status: 500 }
    );
  }
}
