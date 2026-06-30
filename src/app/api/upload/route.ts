import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { ensureStorageBuckets } from '@/db/ensure-storage';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEntitlements } from '@/lib/plans';
import { ensureProfileSchema } from '@/db/ensure-schema';

const BUCKETS = {
  video: 'videos',
  thumbnail: 'thumbnails',
  resume: 'resumes',
  avatar: 'avatars',
} as const;

type UploadKind = keyof typeof BUCKETS;

async function ensureBuckets(admin: NonNullable<ReturnType<typeof createAdminClient>>) {
  for (const bucket of Object.values(BUCKETS)) {
    await admin.storage.createBucket(bucket, { public: true, fileSizeLimit: 262144000 }).catch(() => {});
  }
}

function pathFor(kind: UploadKind, userId: string, file: File) {
  switch (kind) {
    case 'video': {
      const ext = file.type.includes('webm') ? 'webm' : 'mp4';
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

    const entitlements = await getUserEntitlements(user.id);

    if (kind === 'video' && file.size > entitlements.maxUploadBytes) {
      return NextResponse.json(
        { error: `Video must be ${Math.round(entitlements.maxUploadBytes / (1024 * 1024))}MB or smaller on your plan.` },
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

    const bucket = BUCKETS[kind];
    const path = pathFor(kind, user.id, file);
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'application/octet-stream';

    const admin = createAdminClient();
    const storageClient = admin ?? supabase;

    await ensureStorageBuckets();

    if (admin) {
      await ensureBuckets(admin);
    }

    let uploadResult = await storageClient.storage.from(bucket).upload(path, buffer, {
      upsert: true,
      contentType,
      cacheControl: '3600',
    });

    if (uploadResult.error?.message?.toLowerCase().includes('bucket not found')) {
      await ensureStorageBuckets();
      if (admin) await ensureBuckets(admin);
      uploadResult = await storageClient.storage.from(bucket).upload(path, buffer, {
        upsert: true,
        contentType,
        cacheControl: '3600',
      });
    }

    const { error } = uploadResult;

    if (error) {
      console.error('Storage upload failed:', error);
      return NextResponse.json(
        { error: `Upload failed: ${error.message}. Ensure Supabase storage buckets are configured.` },
        { status: 500 }
      );
    }

    const { data } = storageClient.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    console.error('Upload route error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
