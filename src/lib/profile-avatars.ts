export const PROFILE_AVATARS = [
  { id: 'minimal-1', label: 'Classic', src: '/avatars/minimal-1.svg' },
  { id: 'minimal-2', label: 'Neat', src: '/avatars/minimal-2.svg' },
  { id: 'minimal-3', label: 'Flow', src: '/avatars/minimal-3.svg' },
  { id: 'minimal-4', label: 'Bold', src: '/avatars/minimal-4.svg' },
] as const;

const LEGACY_AVATAR_MAP: Record<string, string> = {
  '/avatars/line-1.svg': '/avatars/minimal-1.svg',
  '/avatars/line-2.svg': '/avatars/minimal-2.svg',
  '/avatars/line-3.svg': '/avatars/minimal-3.svg',
  '/avatars/line-4.svg': '/avatars/minimal-4.svg',
  '/avatars/comic-1.svg': '/avatars/minimal-1.svg',
  '/avatars/comic-2.svg': '/avatars/minimal-2.svg',
  '/avatars/comic-3.svg': '/avatars/minimal-3.svg',
  '/avatars/comic-4.svg': '/avatars/minimal-4.svg',
  '/avatars/ember.svg': '/avatars/minimal-1.svg',
  '/avatars/ocean.svg': '/avatars/minimal-2.svg',
  '/avatars/forest.svg': '/avatars/minimal-3.svg',
  '/avatars/violet.svg': '/avatars/minimal-4.svg',
  '/avatars/alex.svg': '/avatars/minimal-1.svg',
  '/avatars/marco.svg': '/avatars/minimal-2.svg',
  '/avatars/maya.svg': '/avatars/minimal-3.svg',
  '/avatars/zara.svg': '/avatars/minimal-4.svg',
  '/avatars/sunny.svg': '/avatars/minimal-1.svg',
  '/avatars/bloom.svg': '/avatars/minimal-4.svg',
  '/avatars/leo.svg': '/avatars/minimal-2.svg',
  '/avatars/nova.svg': '/avatars/minimal-3.svg',
  '/avatars/ink.svg': '/avatars/minimal-1.svg',
  '/avatars/ash.svg': '/avatars/minimal-2.svg',
  '/avatars/mist.svg': '/avatars/minimal-3.svg',
  '/avatars/pale.svg': '/avatars/minimal-4.svg',
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
