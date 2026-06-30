import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { ensureStorageBuckets } from '@/db/ensure-storage';
import {
  getGlobalStorageLimit,
  syncAllStorageLimits,
} from '@/lib/supabase/sync-storage-limits';
import { MAX_BUCKET_FILE_BYTES } from '@/lib/storage-limits';
import { STORAGE_BUCKET_NAMES } from '@/lib/upload-config';

/** Force storage limit sync — call after adding SUPABASE_MANAGEMENT_TOKEN. */
export async function POST() {
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' },
      { status: 503 }
    );
  }

  try {
    await ensureStorageBuckets().catch((err) => {
      console.warn('SQL storage ensure skipped:', err);
    });
    const globalSync = await syncAllStorageLimits(admin);
    const globalFileSizeLimit = await getGlobalStorageLimit();
    const buckets = [];

    for (const id of STORAGE_BUCKET_NAMES) {
      const { data: bucket } = await admin.storage.getBucket(id);
      buckets.push({
        id,
        fileSizeLimit: bucket?.file_size_limit ?? null,
      });
    }

    const globalOk =
      globalFileSizeLimit == null || globalFileSizeLimit >= MAX_BUCKET_FILE_BYTES;

    return NextResponse.json({
      ok: globalSync.ok && globalOk,
      globalSync,
      globalFileSizeLimit,
      requiredLimit: MAX_BUCKET_FILE_BYTES,
      globalOk,
      buckets,
      hint: globalOk
        ? 'Storage is ready for 250 MB uploads.'
        : 'Supabase storage is still capped at 50 MB. Upgrade your Supabase project to Pro and set Storage → Settings → Global file size limit to 250 MB.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Storage sync failed',
      },
      { status: 500 }
    );
  }
}
