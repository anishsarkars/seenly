import { PLANS } from '@/lib/plans';

export const MIN_VIDEO_DURATION_SEC = 60;
export const MAX_VIDEO_DURATION_SEC = PLANS.pro.maxVideoSec;
export const MAX_VIDEO_SIZE_BYTES = PLANS.pro.maxUploadBytes;

export function formatVideoDurationLimit(maxSeconds = PLANS.free.maxVideoSec) {
  if (maxSeconds <= 60) return '60 seconds';
  const minutes = Math.floor(maxSeconds / 60);
  return minutes === 1 ? '1 minute' : `up to ${minutes} minutes`;
}

export function formatUploadLimit(maxBytes = PLANS.free.maxUploadBytes) {
  return `${Math.round(maxBytes / (1024 * 1024))} MB`;
}
