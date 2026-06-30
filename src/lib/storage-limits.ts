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
    `Upload failed: file exceeds the storage limit. Your plan allows up to ${formatBytesLimit(planLimitBytes)}. ` +
    `Supabase may still be capped at 50 MB globally — set Storage → Settings → Global file size limit to 250 MB, ` +
    `or add SUPABASE_MANAGEMENT_TOKEN to auto-sync.`
  );
}
