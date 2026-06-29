export const PROFILE_AVATARS = [
  { id: 'comic-1', label: 'Alex', src: '/avatars/comic-1.svg' },
  { id: 'comic-2', label: 'Sam', src: '/avatars/comic-2.svg' },
  { id: 'comic-3', label: 'Jordan', src: '/avatars/comic-3.svg' },
  { id: 'comic-4', label: 'Riley', src: '/avatars/comic-4.svg' },
] as const;

const LEGACY_AVATAR_MAP: Record<string, string> = {
  '/avatars/ember.svg': '/avatars/comic-1.svg',
  '/avatars/ocean.svg': '/avatars/comic-2.svg',
  '/avatars/forest.svg': '/avatars/comic-3.svg',
  '/avatars/violet.svg': '/avatars/comic-4.svg',
  '/avatars/alex.svg': '/avatars/comic-1.svg',
  '/avatars/marco.svg': '/avatars/comic-2.svg',
  '/avatars/maya.svg': '/avatars/comic-3.svg',
  '/avatars/zara.svg': '/avatars/comic-4.svg',
  '/avatars/sunny.svg': '/avatars/comic-1.svg',
  '/avatars/bloom.svg': '/avatars/comic-4.svg',
  '/avatars/leo.svg': '/avatars/comic-2.svg',
  '/avatars/nova.svg': '/avatars/comic-3.svg',
  '/avatars/ink.svg': '/avatars/comic-1.svg',
  '/avatars/ash.svg': '/avatars/comic-2.svg',
  '/avatars/mist.svg': '/avatars/comic-3.svg',
  '/avatars/pale.svg': '/avatars/comic-4.svg',
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
