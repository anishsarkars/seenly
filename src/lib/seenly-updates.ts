export const SEENLY_UPDATES_VERSION = '2026-07-06-pricing-plans';

export type SeenlyUpdate = {
  version: string;
  title: string;
  description: string;
  hint?: string;
};

export const LATEST_SEENLY_UPDATE: SeenlyUpdate = {
  version: SEENLY_UPDATES_VERSION,
  title: 'Free, Pro & Final boss plans',
  description:
    'Pricing is back on the landing page and at seenly.tech/pricing. Upgrade from dashboard Settings to unlock Pro uploads, unlimited projects, and more.',
  hint: 'Intro video is still optional during onboarding — add one anytime from the dashboard.',
};

export function hasUnreadUpdates(lastSeenVersion: string | null) {
  if (!lastSeenVersion) return true;
  return lastSeenVersion !== SEENLY_UPDATES_VERSION;
}
