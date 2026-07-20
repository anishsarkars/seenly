export const SEENLY_UPDATES_VERSION = '2026-07-20-free-theme';

export type SeenlyUpdate = {
  version: string;
  title: string;
  description: string;
  hint?: string;
};

export const LATEST_SEENLY_UPDATE: SeenlyUpdate = {
  version: SEENLY_UPDATES_VERSION,
  title: 'Free plan + light/dark',
  description:
    'Free is back with tight limits (30s video, 1 project, watermark). Upgrade anytime from the dashboard. Site-wide light and dark mode is available from the header.',
  hint: 'Profiles use a video-first card layout that works on mobile.',
};

export function hasUnreadUpdates(lastSeenVersion: string | null) {
  if (!lastSeenVersion) return true;
  return lastSeenVersion !== SEENLY_UPDATES_VERSION;
}
