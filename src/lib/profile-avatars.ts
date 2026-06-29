export const PROFILE_AVATARS = [
  { id: 'ember', label: 'Ember', src: '/avatars/ember.svg' },
  { id: 'ocean', label: 'Ocean', src: '/avatars/ocean.svg' },
  { id: 'forest', label: 'Forest', src: '/avatars/forest.svg' },
  { id: 'violet', label: 'Violet', src: '/avatars/violet.svg' },
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]['id'];

export type ProfileAvatarSrc = (typeof PROFILE_AVATARS)[number]['src'];

export const DEFAULT_PROFILE_AVATAR: ProfileAvatarSrc = PROFILE_AVATARS[0].src;

export function isPresetAvatar(url?: string | null) {
  if (!url) return false;
  return PROFILE_AVATARS.some((a) => url === a.src || url.endsWith(a.src));
}

export function resolveProfileAvatarSelection(url?: string | null): string {
  if (!url) return DEFAULT_PROFILE_AVATAR;
  const match = PROFILE_AVATARS.find((a) => url === a.src || url.endsWith(`/${a.id}.svg`));
  if (match) return match.src;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return DEFAULT_PROFILE_AVATAR;
}
