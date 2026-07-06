export const SEENLY_UPDATES_VERSION = '2026-07-06-free-optional-video';

export type SeenlyUpdate = {
  version: string;
  title: string;
  description: string;
  hint?: string;
};

export const LATEST_SEENLY_UPDATE: SeenlyUpdate = {
  version: SEENLY_UPDATES_VERSION,
  title: 'Free for everyone — video optional',
  description:
    'Seenly is free by default while we keep things simple. Onboarding no longer requires a video — upload when you are ready, or skip and publish your profile first.',
  hint: 'The upload tab is now the default on the video step. You can add or replace your intro anytime from the dashboard.',
};

export function hasUnreadUpdates(lastSeenVersion: string | null) {
  if (!lastSeenVersion) return true;
  return lastSeenVersion !== SEENLY_UPDATES_VERSION;
}
