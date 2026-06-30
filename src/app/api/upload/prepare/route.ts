import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { ensureStorageBuckets } from '@/db/ensure-storage';
import {
  UPLOAD_BUCKETS,
  contentTypeFor,
  pathFor,
  publicUrlFor,
  type UploadKind,
} from '@/lib/upload-config';
import { getUserEntitlements } from '@/lib/upload-entitlements';
import {
  syncAllStorageLimits,
  assertStorageCanAcceptUpload,
} from '@/lib/supabase/sync-storage-limits';
import type { StorageBucketName } from '@/lib/upload-config';
import { isStorageSizeError } from '@/lib/storage-limits';
import {
  createR2PresignedUploadUrl,
  getR2SetupError,
  shouldUseR2ForVideo,
} from '@/lib/r2/client';

type PrepareBody = {
  kind?: UploadKind;
  fileSize?: number;
  contentType?: string;
  fileName?: string;
  source?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to upload.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as PrepareBody;
    const kind = body.kind;
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : 0;

    if (!kind || !(kind in UPLOAD_BUCKETS)) {
      return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
    }

    if (fileSize <= 0) {
      return NextResponse.json({ error: 'File is empty.' }, { status: 400 });
    }

    const fileMeta = {
      name: typeof body.fileName === 'string' ? body.fileName : `${kind}.bin`,
      type: typeof body.contentType === 'string' ? body.contentType : '',
    };

    const entitlements = await getUserEntitlements(user.id);

    if (kind === 'video' && fileSize > entitlements.maxUploadBytes) {
      return NextResponse.json(
        {
          error: `Video must be ${Math.round(entitlements.maxUploadBytes / (1024 * 1024))}MB or smaller on ${entitlements.label}.`,
          tier: entitlements.tier,
          maxUploadBytes: entitlements.maxUploadBytes,
        },
        { status: 400 }
      );
    }

    if (kind === 'thumbnail' && body.source === 'custom' && !entitlements.customThumbnail) {
      return NextResponse.json(
        { error: 'Custom thumbnails require Seenly Pro or Final boss.' },
        { status: 403 }
      );
    }

    if (kind === 'resume' && fileSize > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume must be 10MB or smaller.' }, { status: 400 });
    }

    const path = pathFor(kind, user.id, fileMeta);
    const contentType = contentTypeFor(kind, fileMeta);

    // Pro/Founder videos → Cloudflare R2 (no Supabase 50 MB cap)
    if (kind === 'video') {
      const r2Error = getR2SetupError(entitlements.tier, fileSize);
      if (r2Error) {
        return NextResponse.json({ error: r2Error }, { status: 503 });
      }

      if (shouldUseR2ForVideo(entitlements.tier, fileSize)) {
        const r2 = await createR2PresignedUploadUrl(path, contentType);
        return NextResponse.json({
          provider: 'r2',
          path: r2.key,
          uploadUrl: r2.uploadUrl,
          publicUrl: r2.publicUrl,
          contentType,
          tier: entitlements.tier,
          maxUploadBytes: entitlements.maxUploadBytes,
        });
      }
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        {
          error:
            'Server storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY to your environment.',
        },
        { status: 503 }
      );
    }

    await ensureStorageBuckets().catch((err) => {
      console.warn('SQL storage ensure skipped:', err);
    });
    const globalSync = await syncAllStorageLimits(admin);

    const bucket = UPLOAD_BUCKETS[kind] as StorageBucketName;

    const capacity = await assertStorageCanAcceptUpload(admin, bucket, fileSize, globalSync);
    if (!capacity.ok) {
      return NextResponse.json({ error: capacity.message, storageSync: globalSync }, { status: 413 });
    }

    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUploadUrl(path, { upsert: true });

    if (error || !data?.token) {
      throw new Error(error?.message || 'Could not create upload URL.');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL is not configured.' }, { status: 503 });
    }

    return NextResponse.json({
      provider: 'supabase',
      bucket,
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      contentType,
      publicUrl: publicUrlFor(bucket, path, supabaseUrl),
      tier: entitlements.tier,
      maxUploadBytes: entitlements.maxUploadBytes,
    });
  } catch (error) {
    console.error('Upload prepare error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
    const status = isStorageSizeError(message) ? 413 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
