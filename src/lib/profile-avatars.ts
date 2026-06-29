export const PROFILE_AVATARS = [
  { id: 'alex', label: 'Alex', gender: 'male' as const, src: '/avatars/alex.svg' },
  { id: 'marco', label: 'Marco', gender: 'male' as const, src: '/avatars/marco.svg' },
  { id: 'maya', label: 'Maya', gender: 'female' as const, src: '/avatars/maya.svg' },
  { id: 'zara', label: 'Zara', gender: 'female' as const, src: '/avatars/zara.svg' },
] as const;

/** Maps legacy avatar paths to the new clay-style set. */
const LEGACY_AVATAR_MAP: Record<string, string> = {
  '/avatars/ember.svg': '/avatars/alex.svg',
  '/avatars/ocean.svg': '/avatars/marco.svg',
  '/avatars/forest.svg': '/avatars/maya.svg',
  '/avatars/violet.svg': '/avatars/zara.svg',
};

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]['id'];

export type ProfileAvatarSrc = (typeof PROFILE_AVATARS)[number]['src'];

export const DEFAULT_PROFILE_AVATAR: ProfileAvatarSrc = PROFILE_AVATARS[0].src;

export const AVATAR_UPDATE_BANNER_KEY = 'seenly-avatar-v2-dismissed';

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
