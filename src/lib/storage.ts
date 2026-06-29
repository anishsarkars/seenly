import type { SupabaseClient } from '@supabase/supabase-js';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export async function validateVideoFile(file: Blob): Promise<{ ok: true } | { ok: false; error: string }> {
  if (file.size > MAX_VIDEO_BYTES) {
    return { ok: false, error: 'Video must be 50MB or smaller.' };
  }

  const url = URL.createObjectURL(file);
  try {
    const duration = await getMediaDuration(url);
    if (duration > 60) {
      return { ok: false, error: 'Video must be 60 seconds or shorter.' };
    }
    return { ok: true };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function getMediaDuration(src: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => resolve(video.duration);
    video.onerror = () => reject(new Error('Could not read video metadata.'));
    video.src = src;
  });
}

export async function captureVideoThumbnail(source: string): Promise<Blob> {
  const video = document.createElement('video');
  video.src = source;
  video.crossOrigin = 'anonymous';
  video.muted = true;
  video.playsInline = true;

  await new Promise<void>((resolve, reject) => {
    video.onloadeddata = () => resolve();
    video.onerror = () => reject(new Error('Could not load video for thumbnail.'));
  });

  video.currentTime = Math.min(1, video.duration / 2);
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

async function uploadBlob(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  file: Blob,
  contentType: string
) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProfileVideo(supabase: SupabaseClient, userId: string, file: Blob) {
  const validation = await validateVideoFile(file);
  if (!validation.ok) throw new Error(validation.error);

  const ext = file.type.includes('webm') ? 'webm' : 'mp4';
  const contentType = file.type || (ext === 'webm' ? 'video/webm' : 'video/mp4');
  return uploadBlob(supabase, 'videos', `${userId}/intro.${ext}`, file, contentType);
}

export async function uploadProfileThumbnail(supabase: SupabaseClient, userId: string, file: Blob) {
  return uploadBlob(supabase, 'thumbnails', `${userId}/poster.jpg`, file, 'image/jpeg');
}

export async function uploadProfileResume(supabase: SupabaseClient, userId: string, file: File) {
  if (file.size > MAX_RESUME_BYTES) {
    throw new Error('Resume must be 10MB or smaller.');
  }
  if (file.type !== 'application/pdf') {
    throw new Error('Resume must be a PDF file.');
  }
  return uploadBlob(supabase, 'resumes', `${userId}/resume.pdf`, file, 'application/pdf');
}

export async function uploadProfileAvatar(supabase: SupabaseClient, userId: string, file: Blob) {
  return uploadBlob(supabase, 'avatars', `${userId}/avatar.jpg`, file, 'image/jpeg');
}
