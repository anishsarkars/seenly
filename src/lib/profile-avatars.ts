export const PROFILE_AVATARS = [
  { id: 'sunny', label: 'Sunny', kind: 'smile' as const, src: '/avatars/sunny.svg' },
  { id: 'bloom', label: 'Bloom', kind: 'smile' as const, src: '/avatars/bloom.svg' },
  { id: 'leo', label: 'Leo', kind: 'portrait' as const, gender: 'male' as const, src: '/avatars/leo.svg' },
  { id: 'nova', label: 'Nova', kind: 'portrait' as const, gender: 'female' as const, src: '/avatars/nova.svg' },
] as const;

/** Maps legacy avatar paths to the current set. */
const LEGACY_AVATAR_MAP: Record<string, string> = {
  '/avatars/ember.svg': '/avatars/sunny.svg',
  '/avatars/ocean.svg': '/avatars/leo.svg',
  '/avatars/forest.svg': '/avatars/nova.svg',
  '/avatars/violet.svg': '/avatars/bloom.svg',
  '/avatars/alex.svg': '/avatars/leo.svg',
  '/avatars/marco.svg': '/avatars/leo.svg',
  '/avatars/maya.svg': '/avatars/nova.svg',
  '/avatars/zara.svg': '/avatars/bloom.svg',
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
