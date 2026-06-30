import { PLANS } from '@/lib/plans';
import { createClient } from '@/utils/supabase/client';
import { isStorageSizeError, storageSizeErrorMessage } from '@/lib/storage-limits';
import { uploadBlobToPresignedUrl } from '@/lib/r2/upload';
import { shouldUseResumableUpload, uploadViaTus } from '@/lib/storage-tus';

export type VideoUploadLimits = {
  maxVideoSec: number;
  maxUploadBytes: number;
};

export const FREE_VIDEO_LIMITS: VideoUploadLimits = {
  maxVideoSec: PLANS.free.maxVideoSec,
  maxUploadBytes: PLANS.free.maxUploadBytes,
};

type PreparePayload = {
  provider?: 'supabase' | 'r2';
  bucket?: string;
  path: string;
  token?: string;
  signedUrl?: string;
  uploadUrl?: string;
  contentType?: string;
  publicUrl: string;
  maxUploadBytes?: number;
};

async function uploadBytesToStorage(
  payload: PreparePayload,
  fileBuffer: ArrayBuffer,
  contentType: string
) {
  const supabase = createClient();

  if (payload.token && payload.bucket) {
    const { error: signedError } = await supabase.storage
      .from(payload.bucket)
      .uploadToSignedUrl(payload.path, payload.token, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (!signedError) return;
  }

  if (!payload.bucket) {
    throw new Error('Storage bucket missing for upload.');
  }

  const { error: directError } = await supabase.storage
    .from(payload.bucket)
    .upload(payload.path, fileBuffer, {
      upsert: true,
      contentType,
      cacheControl: '3600',
    });

  if (!directError) return;

  if (payload.signedUrl) {
    const putRes = await fetch(payload.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: fileBuffer,
    });
    if (putRes.ok) return;
    const putText = await putRes.text().catch(() => '');
    throw new Error(putText || `Upload failed (${putRes.status})`);
  }

  throw directError;
}

export async function uploadFile(
  file: Blob,
  kind: 'video' | 'thumbnail' | 'resume' | 'avatar',
  fileName?: string,
  extraFields?: Record<string, string>,
  onProgress?: (percent: number) => void
): Promise<string> {
  const prepResponse = await fetch('/api/upload/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({
      kind,
      fileSize: file.size,
      contentType: file.type || 'application/octet-stream',
      fileName: fileName || `${kind}.bin`,
      ...extraFields,
    }),
  });

  const payload = (await prepResponse.json().catch(() => ({}))) as PreparePayload & {
    error?: string;
  };

  if (!prepResponse.ok) {
    throw new Error(typeof payload.error === 'string' ? payload.error : 'Upload failed.');
  }

  if (!payload.path || !payload.publicUrl) {
    throw new Error('Upload could not be prepared. Please try again.');
  }

  const contentType = payload.contentType || file.type || 'application/octet-stream';
  const planLimit =
    typeof payload.maxUploadBytes === 'number' ? payload.maxUploadBytes : PLANS.free.maxUploadBytes;

  try {
    if (payload.provider === 'r2' && payload.uploadUrl) {
      await uploadBlobToPresignedUrl(file, payload.uploadUrl, contentType, onProgress);
    } else if (shouldUseResumableUpload(file, kind) && payload.bucket) {
      await uploadViaTus(
        file,
        {
          bucket: payload.bucket,
          path: payload.path,
          token: payload.token,
          contentType,
        },
        onProgress
      );
    } else {
      const fileBuffer = await file.arrayBuffer();
      await uploadBytesToStorage(payload, fileBuffer, contentType);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload to storage failed.';
    if (isStorageSizeError(message)) {
      throw new Error(storageSizeErrorMessage(planLimit));
    }
    throw new Error(message);
  }

  return payload.publicUrl;
}

export function isPersistedMediaUrl(url?: string | null) {
  return !!url && url.startsWith('http') && !url.startsWith('blob:');
}

function formatDurationLimit(seconds: number) {
  if (seconds <= 60) return '60 seconds';
  const minutes = Math.floor(seconds / 60);
  return minutes === 1 ? '1 minute' : `${minutes} minutes`;
}

async function getMediaDuration(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) {
        resolve(0);
      } else {
        resolve(duration);
      }
    };
    video.onerror = () => reject(new Error('Could not read video metadata.'));
    video.src = src;
  });
}

export async function validateVideoFile(
  file: Blob,
  maxSeconds = PLANS.free.maxVideoSec,
  maxBytes = PLANS.free.maxUploadBytes
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.size > maxBytes) {
    return { ok: false, error: `Video must be ${Math.round(maxBytes / (1024 * 1024))}MB or smaller.` };
  }

  const url = URL.createObjectURL(file);
  try {
    const duration = await getMediaDuration(url);
    if (duration > maxSeconds) {
      return { ok: false, error: `Video must be ${formatDurationLimit(maxSeconds)} or shorter.` };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function captureVideoThumbnail(source: string): Promise<Blob> {
  const video = document.createElement('video');
  video.src = source;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error('Could not load video for thumbnail.'));
  });

  video.currentTime = Math.min(1, Math.max(video.duration / 2, 0));
  await new Promise<void>((resolve) => {
    video.onseeked = () => resolve();
  });

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create thumbnail.');

  const scale = Math.max(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
  const width = video.videoWidth * scale;
  const height = video.videoHeight * scale;
  const x = (canvas.width - width) / 2;
  const y = (canvas.height - height) / 2;
  ctx.drawImage(video, x, y, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not generate thumbnail.'))),
      'image/jpeg',
      0.85
    );
  });
}

export async function uploadProfileVideo(
  file: Blob,
  fileName?: string,
  limits: VideoUploadLimits = FREE_VIDEO_LIMITS,
  onProgress?: (percent: number) => void
) {
  const validation = await validateVideoFile(file, limits.maxVideoSec, limits.maxUploadBytes);
  if (!validation.ok) throw new Error(validation.error);
  return uploadFile(file, 'video', fileName, undefined, onProgress);
}

export async function uploadProfileThumbnail(file: Blob) {
  return uploadFile(file, 'thumbnail', 'poster.jpg', { source: 'auto' });
}

export async function uploadProfileResume(file: File) {
  if (file.type !== 'application/pdf') {
    throw new Error('Resume must be a PDF file.');
  }
  return uploadFile(file, 'resume', file.name);
}

export async function fetchUploadLimits(): Promise<VideoUploadLimits> {
  const res = await fetch('/api/billing/entitlements', { credentials: 'same-origin' });
  if (!res.ok) return FREE_VIDEO_LIMITS;
  const data = await res.json();
  return {
    maxVideoSec: typeof data.maxVideoSec === 'number' ? data.maxVideoSec : PLANS.free.maxVideoSec,
    maxUploadBytes:
      typeof data.maxUploadBytes === 'number' ? data.maxUploadBytes : PLANS.free.maxUploadBytes,
  };
}
