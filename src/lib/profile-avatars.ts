export const PROFILE_AVATARS = [
  { id: 'flat-1', label: 'Sunny', src: '/avatars/flat-1.svg' },
  { id: 'flat-2', label: 'Indigo', src: '/avatars/flat-2.svg' },
  { id: 'flat-3', label: 'Cocoa', src: '/avatars/flat-3.svg' },
  { id: 'flat-4', label: 'Coral', src: '/avatars/flat-4.svg' },
  { id: 'flat-5', label: 'Sage', src: '/avatars/flat-5.svg' },
  { id: 'flat-6', label: 'Violet', src: '/avatars/flat-6.svg' },
] as const;

const LEGACY_AVATAR_MAP: Record<string, string> = {
  '/avatars/geo-1.svg': '/avatars/flat-1.svg',
  '/avatars/geo-2.svg': '/avatars/flat-2.svg',
  '/avatars/geo-3.svg': '/avatars/flat-3.svg',
  '/avatars/geo-4.svg': '/avatars/flat-4.svg',
  '/avatars/minimal-1.svg': '/avatars/flat-1.svg',
  '/avatars/minimal-2.svg': '/avatars/flat-2.svg',
  '/avatars/minimal-3.svg': '/avatars/flat-3.svg',
  '/avatars/minimal-4.svg': '/avatars/flat-4.svg',
  '/avatars/line-1.svg': '/avatars/flat-1.svg',
  '/avatars/line-2.svg': '/avatars/flat-2.svg',
  '/avatars/line-3.svg': '/avatars/flat-3.svg',
  '/avatars/line-4.svg': '/avatars/flat-4.svg',
  '/avatars/comic-1.svg': '/avatars/flat-1.svg',
  '/avatars/comic-2.svg': '/avatars/flat-2.svg',
  '/avatars/comic-3.svg': '/avatars/flat-3.svg',
  '/avatars/comic-4.svg': '/avatars/flat-4.svg',
  '/avatars/ember.svg': '/avatars/flat-1.svg',
  '/avatars/ocean.svg': '/avatars/flat-2.svg',
  '/avatars/forest.svg': '/avatars/flat-5.svg',
  '/avatars/violet.svg': '/avatars/flat-6.svg',
  '/avatars/alex.svg': '/avatars/flat-1.svg',
  '/avatars/marco.svg': '/avatars/flat-2.svg',
  '/avatars/maya.svg': '/avatars/flat-3.svg',
  '/avatars/zara.svg': '/avatars/flat-4.svg',
  '/avatars/sunny.svg': '/avatars/flat-1.svg',
  '/avatars/bloom.svg': '/avatars/flat-4.svg',
  '/avatars/leo.svg': '/avatars/flat-2.svg',
  '/avatars/nova.svg': '/avatars/flat-3.svg',
  '/avatars/ink.svg': '/avatars/flat-1.svg',
  '/avatars/ash.svg': '/avatars/flat-2.svg',
  '/avatars/mist.svg': '/avatars/flat-3.svg',
  '/avatars/pale.svg': '/avatars/flat-4.svg',
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
