export async function uploadFile(
  file: Blob,
  kind: 'video' | 'thumbnail' | 'resume' | 'avatar',
  fileName?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('file', file, fileName || `${kind}.bin`);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Upload failed.');
  }

  if (!payload.url || typeof payload.url !== 'string') {
    throw new Error('Upload succeeded but no URL was returned.');
  }

  return payload.url;
}

export function isPersistedMediaUrl(url?: string | null) {
  return !!url && url.startsWith('http') && !url.startsWith('blob:');
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

export async function validateVideoFile(file: Blob, maxSeconds = 120): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.size > 50 * 1024 * 1024) {
    return { ok: false, error: 'Video must be 50MB or smaller.' };
  }

  const url = URL.createObjectURL(file);
  try {
    const duration = await getMediaDuration(url);
    if (duration > maxSeconds) {
      return { ok: false, error: `Video must be ${maxSeconds} seconds or shorter.` };
    }
    return { ok: true };
  } catch {
    // Recorded WebM blobs may not expose duration reliably in all browsers.
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

export async function uploadProfileVideo(file: Blob, fileName?: string) {
  const validation = await validateVideoFile(file);
  if (!validation.ok) throw new Error(validation.error);
  return uploadFile(file, 'video', fileName);
}

export async function uploadProfileThumbnail(file: Blob) {
  return uploadFile(file, 'thumbnail', 'poster.jpg');
}

export async function uploadProfileResume(file: File) {
  if (file.type !== 'application/pdf') {
    throw new Error('Resume must be a PDF file.');
  }
  return uploadFile(file, 'resume', file.name);
}
