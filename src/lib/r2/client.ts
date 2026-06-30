import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { PlanTier } from '@/lib/plans';

const SUPABASE_FREE_MAX_BYTES = 50 * 1024 * 1024;

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

export function isR2Configured() {
  return getR2Config() != null;
}

/** Pro/Founder videos go to R2 when configured (bypasses Supabase 50 MB cap). */
export function shouldUseR2ForVideo(tier: PlanTier, fileSize: number) {
  if (!isR2Configured()) return false;
  if (tier !== 'free') return true;
  return fileSize > SUPABASE_FREE_MAX_BYTES;
}

function createR2Client(config: R2Config) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function r2PublicUrlFor(key: string, config: R2Config = getR2Config()!) {
  const base = config.publicUrl.replace(/\/$/, '');
  const path = key.replace(/^\//, '');
  return `${base}/${path}`;
}

export async function createR2PresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const config = getR2Config();
  if (!config) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const client = createR2Client(config);
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  return {
    uploadUrl,
    publicUrl: r2PublicUrlFor(key, config),
    key,
  };
}

export function getR2SetupError(tier: PlanTier, fileSize: number): string | null {
  if (shouldUseR2ForVideo(tier, fileSize) || (tier !== 'free' && fileSize > SUPABASE_FREE_MAX_BYTES)) {
    if (!isR2Configured()) {
      return (
        'Large Pro video uploads use Cloudflare R2, which is not configured yet. ' +
        'Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_PUBLIC_URL to your environment.'
      );
    }
  }
  return null;
}
