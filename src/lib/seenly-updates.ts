export const SEENLY_UPDATES_VERSION = '2026-06-30-minimal-video-player';

export type SeenlyUpdate = {
  version: string;
  title: string;
  description: string;
  hint?: string;
};

export const LATEST_SEENLY_UPDATE: SeenlyUpdate = {
  version: SEENLY_UPDATES_VERSION,
  title: 'Minimal video player',
  description:
    'Public profiles now use a cleaner custom player with play/pause and a slim progress bar instead of default browser controls.',
  hint: 'Open any profile link to see it — your video keeps its natural aspect ratio.',
};

export function hasUnreadUpdates(lastSeenVersion: string | null) {
  if (!lastSeenVersion) return true;
  return lastSeenVersion !== SEENLY_UPDATES_VERSION;
}
