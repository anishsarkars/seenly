const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://seenly.tech').replace(/\/$/, '');

export function getProfileOgImageUrl(username: string) {
  return `${APP_URL}/${encodeURIComponent(username)}/opengraph-image`;
}

export const PROFILE_OG_SIZE = { width: 1200, height: 630 } as const;
