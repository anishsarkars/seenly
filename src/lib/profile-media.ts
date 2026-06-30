const PLACEHOLDER_MEDIA_MARKERS = [
  'images.unsplash.com',
  'mixkit.co',
  'assets.mixkit.co',
] as const;

export function isPlaceholderMediaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  return PLACEHOLDER_MEDIA_MARKERS.some((marker) => url.includes(marker));
}

export function isUserUploadedMediaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http') || url.startsWith('blob:')) return false;
  return !isPlaceholderMediaUrl(url);
}

export function resolveProfileThumbnailUrl(
  thumbnailUrl?: string | null,
  updatedAt?: Date | string | null
): string | undefined {
  if (!isUserUploadedMediaUrl(thumbnailUrl)) return undefined;

  const version = updatedAt ? new Date(updatedAt).getTime() : undefined;
  if (!version || Number.isNaN(version)) return thumbnailUrl!;

  const separator = thumbnailUrl!.includes('?') ? '&' : '?';
  return `${thumbnailUrl}${separator}v=${version}`;
}

export function sanitizeProfileMedia<T extends { videoUrl?: string | null; thumbnailUrl?: string | null }>(
  user: T
): T {
  return {
    ...user,
    videoUrl: isPlaceholderMediaUrl(user.videoUrl) ? null : user.videoUrl ?? null,
    thumbnailUrl: isPlaceholderMediaUrl(user.thumbnailUrl) ? null : user.thumbnailUrl ?? null,
  };
}
