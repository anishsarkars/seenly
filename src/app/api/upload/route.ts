import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { ensureStorageBuckets } from '@/db/ensure-storage';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEntitlements } from '@/lib/plans';
import { ensureProfileSchema } from '@/db/ensure-schema';
import {
  uploadWithAdminStorage,
  type StorageBucketName,
} from '@/lib/supabase/storage-server';

const BUCKETS = {
  video: 'videos',
  thumbnail: 'thumbnails',
  resume: 'resumes',
  avatar: 'avatars',
} as const;

type UploadKind = keyof typeof BUCKETS;

function pathFor(kind: UploadKind, userId: string, file: File) {
  switch (kind) {
    case 'video': {
      const ext =
        file.type.includes('webm') || file.name.endsWith('.webm') ? 'webm' : 'mp4';
      return `${userId}/intro.${ext}`;
    }
    case 'thumbnail':
      return `${userId}/poster.jpg`;
    case 'resume':
      return `${userId}/resume.pdf`;
    case 'avatar':
      return `${userId}/avatar.jpg`;
  }
}

function contentTypeFor(kind: UploadKind, file: File) {
  if (file.type) return file.type;
  switch (kind) {
    case 'video':
      return file.name.endsWith('.webm') ? 'video/webm' : 'video/mp4';
    case 'thumbnail':
      return 'image/jpeg';
    case 'resume':
      return 'application/pdf';
    case 'avatar':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}

async function getUserEntitlements(userId: string) {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('your-supabase')) {
    return getEntitlements({});
  }

  try {
    await ensureProfileSchema();
    const [row] = await db
      .select({
        plan: users.plan,
        planStatus: users.planStatus,
        planExpiresAt: users.planExpiresAt,
        isFounder: users.isFounder,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return getEntitlements(row ?? {});
  } catch (error) {
    console.error('Failed to load plan entitlements, using free tier:', error);
    return getEntitlements({});
  }
}

/** Fallback when service role key is absent (local dev only). */
async function uploadWithUserStorage({
  bucket,
  path,
  data,
  contentType,
  supabase,
}: {
  bucket: StorageBucketName;
  path: string;
  data: Buffer;
  contentType: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}) {
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    upsert: true,
    contentType,
    cacheControl: '3600',
  });

  if (error) {
    throw new Error(
      `${error.message}. If this persists, set SUPABASE_SERVICE_ROLE_KEY on the server and run npm run db:storage.`
    );
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to upload.' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = formData.get('kind') as UploadKind;

    if (!(file instanceof File) || !kind || !(kind in BUCKETS)) {
      return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty.' }, { status: 400 });
    }

    const entitlements = await getUserEntitlements(user.id);

    if (kind === 'video' && file.size > entitlements.maxUploadBytes) {
      return NextResponse.json(
        {
          error: `Video must be ${Math.round(entitlements.maxUploadBytes / (1024 * 1024))}MB or smaller on your plan.`,
        },
        { status: 400 }
      );
    }

    if (
      kind === 'thumbnail' &&
      formData.get('source') === 'custom' &&
      !entitlements.customThumbnail
    ) {
      return NextResponse.json(
        { error: 'Custom thumbnails require Seenly Pro or Final boss.' },
        { status: 403 }
      );
    }

    if (kind === 'resume' && file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume must be 10MB or smaller.' }, { status: 400 });
    }

    const bucket = BUCKETS[kind] as StorageBucketName;
    const path = pathFor(kind, user.id, file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = contentTypeFor(kind, file);

    // Best-effort bucket + policy setup via SQL (when DATABASE_URL is configured)
    await ensureStorageBuckets().catch((err) => {
      console.warn('SQL storage ensure skipped:', err);
    });

    let publicUrl: string;
    const admin = createAdminClient();

    if (admin) {
      publicUrl = await uploadWithAdminStorage({
        bucket,
        path,
        data: buffer,
        contentType,
      });
    } else {
      console.warn('SUPABASE_SERVICE_ROLE_KEY missing — using authenticated user storage (may fail without buckets/policies).');
      publicUrl = await uploadWithUserStorage({
        bucket,
        path,
        data: buffer,
        contentType,
        supabase,
      });
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload route error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
    const status = message.includes('not configured') || message.includes('SERVICE_ROLE') ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
