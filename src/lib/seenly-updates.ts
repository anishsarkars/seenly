export const SEENLY_UPDATES_VERSION = '2026-06-30-project-links-resume';

export function hasUnreadUpdates(lastSeenVersion: string | null) {
  if (!lastSeenVersion) return true;
  return lastSeenVersion !== SEENLY_UPDATES_VERSION;
}
