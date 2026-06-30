import { PLANS } from '@/lib/plans';

/** Largest upload allowed on any paid plan — bucket limit must match this. */
export const MAX_BUCKET_FILE_BYTES = PLANS.founder.maxUploadBytes;

export function formatBytesLimit(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function isStorageSizeError(message: string) {
  return /exceeded the maximum allowed size|payload too large|entity too large/i.test(message);
}

export function storageSizeErrorMessage(planLimitBytes: number) {
  return (
    `Upload failed: file exceeds the storage limit. Your Seenly plan allows up to ${formatBytesLimit(planLimitBytes)}. ` +
    `Your Supabase project may still be capped at 50 MB — open Supabase Dashboard → Storage → Settings → ` +
    `set Global file size limit to 250 MB (requires Supabase Pro on your Supabase project, not just Seenly Pro).`
  );
}
