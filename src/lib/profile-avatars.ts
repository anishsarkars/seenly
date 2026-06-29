export const PROFILE_AVATARS = [
  { id: 'ink', label: 'Ink', src: '/avatars/ink.svg' },
  { id: 'ash', label: 'Ash', src: '/avatars/ash.svg' },
  { id: 'mist', label: 'Mist', src: '/avatars/mist.svg' },
  { id: 'pale', label: 'Pale', src: '/avatars/pale.svg' },
] as const;

const LEGACY_AVATAR_MAP: Record<string, string> = {
  '/avatars/ember.svg': '/avatars/ink.svg',
  '/avatars/ocean.svg': '/avatars/ash.svg',
  '/avatars/forest.svg': '/avatars/mist.svg',
  '/avatars/violet.svg': '/avatars/pale.svg',
  '/avatars/alex.svg': '/avatars/ink.svg',
  '/avatars/marco.svg': '/avatars/ash.svg',
  '/avatars/maya.svg': '/avatars/mist.svg',
  '/avatars/zara.svg': '/avatars/pale.svg',
  '/avatars/sunny.svg': '/avatars/ink.svg',
  '/avatars/bloom.svg': '/avatars/pale.svg',
  '/avatars/leo.svg': '/avatars/ash.svg',
  '/avatars/nova.svg': '/avatars/mist.svg',
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
