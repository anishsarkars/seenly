import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getStorageConfigErrors, ensureStorageBucketsAdmin } from '@/lib/supabase/storage-server';

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
    await ensureStorageBucketsAdmin(admin);
    const { data: buckets, error } = await admin.storage.listBuckets();
    if (error) {
      return NextResponse.json({ ok: false, configErrors, error: error.message }, { status: 500 });
    }

    const required = ['videos', 'thumbnails', 'resumes', 'avatars'];
    const found = (buckets ?? []).map((b) => b.id);
    const missing = required.filter((id) => !found.includes(id));

    return NextResponse.json({
      ok: missing.length === 0 && configErrors.length === 0,
      configErrors,
      buckets: buckets?.map((b) => ({ id: b.id, public: b.public })),
      missing,
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
