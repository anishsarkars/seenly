export const PROFILE_AVATARS = [
  { id: 'face-1', label: 'Alex', src: '/avatars/face-1.svg' },
  { id: 'face-2', label: 'Sam', src: '/avatars/face-2.svg' },
  { id: 'face-3', label: 'Riley', src: '/avatars/face-3.svg' },
  { id: 'face-4', label: 'Jordan', src: '/avatars/face-4.svg' },
] as const;

const LEGACY_AVATAR_MAP: Record<string, string> = {
  '/avatars/dot-1.svg': '/avatars/face-1.svg',
  '/avatars/dot-2.svg': '/avatars/face-2.svg',
  '/avatars/dot-3.svg': '/avatars/face-3.svg',
  '/avatars/dot-4.svg': '/avatars/face-4.svg',
  '/avatars/flat-1.svg': '/avatars/face-3.svg',
  '/avatars/flat-2.svg': '/avatars/face-2.svg',
  '/avatars/flat-3.svg': '/avatars/face-1.svg',
  '/avatars/flat-4.svg': '/avatars/face-3.svg',
  '/avatars/flat-5.svg': '/avatars/face-4.svg',
  '/avatars/flat-6.svg': '/avatars/face-1.svg',
  '/avatars/geo-1.svg': '/avatars/face-1.svg',
  '/avatars/geo-2.svg': '/avatars/face-2.svg',
  '/avatars/geo-3.svg': '/avatars/face-3.svg',
  '/avatars/geo-4.svg': '/avatars/face-4.svg',
  '/avatars/minimal-1.svg': '/avatars/face-1.svg',
  '/avatars/minimal-2.svg': '/avatars/face-2.svg',
  '/avatars/minimal-3.svg': '/avatars/face-3.svg',
  '/avatars/minimal-4.svg': '/avatars/face-4.svg',
  '/avatars/line-1.svg': '/avatars/face-1.svg',
  '/avatars/line-2.svg': '/avatars/face-2.svg',
  '/avatars/line-3.svg': '/avatars/face-3.svg',
  '/avatars/line-4.svg': '/avatars/face-4.svg',
  '/avatars/comic-1.svg': '/avatars/face-1.svg',
  '/avatars/comic-2.svg': '/avatars/face-2.svg',
  '/avatars/comic-3.svg': '/avatars/face-3.svg',
  '/avatars/comic-4.svg': '/avatars/face-4.svg',
};

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]['id'];

export type ProfileAvatarSrc = (typeof PROFILE_AVATARS)[number]['src'];

export const DEFAULT_PROFILE_AVATAR: ProfileAvatarSrc = PROFILE_AVATARS[0].src;

export function isPresetAvatar(url?: string | null) {
  if (!url) return false;
  return PROFILE_AVATARS.some((a) => url === a.src || url.endsWith(a.src));
}

export function resolveProfileAvatarSelection(url?: string | null): string {
  if (!url) return DEFAULT_PROFILE_AVATAR;

  const legacy = LEGACY_AVATAR_MAP[url];
  if (legacy) return legacy;

  const match = PROFILE_AVATARS.find((a) => url === a.src || url.endsWith(`/${a.id}.svg`));
  if (match) return match.src;

  if (url.startsWith('http') || url.startsWith('/')) return url;

  return DEFAULT_PROFILE_AVATAR;
}
