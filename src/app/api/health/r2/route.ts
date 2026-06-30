import { NextResponse } from 'next/server';
import { getR2Config, isR2Configured } from '@/lib/r2/client';

/** Check Cloudflare R2 configuration for Pro video uploads. */
export async function GET() {
  const configured = isR2Configured();
  const config = getR2Config();

  return NextResponse.json({
    ok: configured,
    configured,
    bucketName: config?.bucketName ?? null,
    publicUrl: config?.publicUrl ?? null,
    hint: configured
      ? 'R2 is ready for Pro video uploads (up to 250 MB).'
      : 'Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL to enable Pro video uploads.',
  });
}
