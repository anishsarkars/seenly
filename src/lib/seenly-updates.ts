export const SEENLY_UPDATES_VERSION = '2026-07-20-pro-trial';

export type SeenlyUpdate = {
  version: string;
  title: string;
  description: string;
  hint?: string;
};

export const LATEST_SEENLY_UPDATE: SeenlyUpdate = {
  version: SEENLY_UPDATES_VERSION,
  title: '14-day Pro trial',
  description:
    'There is no permanent free plan anymore. New profiles get full Pro for 14 days. After that, subscribe to keep your profile public.',
  hint: 'Subscribe anytime from Dashboard → Settings before your trial ends.',
};

export function hasUnreadUpdates(lastSeenVersion: string | null) {
  if (!lastSeenVersion) return true;
  return lastSeenVersion !== SEENLY_UPDATES_VERSION;
}
