export const SEENLY_UPDATES_VERSION = '2026-07-02';

export function hasUnreadUpdates(lastSeenVersion: string | null) {
  if (!lastSeenVersion) return true;
  return lastSeenVersion !== SEENLY_UPDATES_VERSION;
}
