export const PROFILE_AVATARS = [
  { id: 'geo-1', label: 'Plain', src: '/avatars/geo-1.svg' },
  { id: 'geo-2', label: 'Cap', src: '/avatars/geo-2.svg' },
  { id: 'geo-3', label: 'Soft', src: '/avatars/geo-3.svg' },
  { id: 'geo-4', label: 'Long', src: '/avatars/geo-4.svg' },
] as const;

const LEGACY_AVATAR_MAP: Record<string, string> = {
  '/avatars/minimal-1.svg': '/avatars/geo-1.svg',
  '/avatars/minimal-2.svg': '/avatars/geo-2.svg',
  '/avatars/minimal-3.svg': '/avatars/geo-3.svg',
  '/avatars/minimal-4.svg': '/avatars/geo-4.svg',
  '/avatars/line-1.svg': '/avatars/geo-1.svg',
  '/avatars/line-2.svg': '/avatars/geo-2.svg',
  '/avatars/line-3.svg': '/avatars/geo-3.svg',
  '/avatars/line-4.svg': '/avatars/geo-4.svg',
  '/avatars/comic-1.svg': '/avatars/geo-1.svg',
  '/avatars/comic-2.svg': '/avatars/geo-2.svg',
  '/avatars/comic-3.svg': '/avatars/geo-3.svg',
  '/avatars/comic-4.svg': '/avatars/geo-4.svg',
  '/avatars/ember.svg': '/avatars/geo-1.svg',
  '/avatars/ocean.svg': '/avatars/geo-2.svg',
  '/avatars/forest.svg': '/avatars/geo-3.svg',
  '/avatars/violet.svg': '/avatars/geo-4.svg',
  '/avatars/alex.svg': '/avatars/geo-1.svg',
  '/avatars/marco.svg': '/avatars/geo-2.svg',
  '/avatars/maya.svg': '/avatars/geo-3.svg',
  '/avatars/zara.svg': '/avatars/geo-4.svg',
  '/avatars/sunny.svg': '/avatars/geo-1.svg',
  '/avatars/bloom.svg': '/avatars/geo-4.svg',
  '/avatars/leo.svg': '/avatars/geo-2.svg',
  '/avatars/nova.svg': '/avatars/geo-3.svg',
  '/avatars/ink.svg': '/avatars/geo-1.svg',
  '/avatars/ash.svg': '/avatars/geo-2.svg',
  '/avatars/mist.svg': '/avatars/geo-3.svg',
  '/avatars/pale.svg': '/avatars/geo-4.svg',
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
