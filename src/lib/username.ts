export const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

export const RESERVED_USERNAMES = new Set([
  'admin',
  'login',
  'signup',
  'dashboard',
  'settings',
  'pricing',
  'about',
  'privacy',
  'terms',
  'api',
  'support',
  'docs',
  'explore',
  'onboarding',
  'auth',
  'www',
  'app',
  'help',
  'blog',
  'status',
]);

export function normalizeUsername(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  const normalized = normalizeUsername(username);

  if (!normalized) {
    return { valid: false, error: 'Username is required.' };
  }

  if (normalized.length < 3 || normalized.length > 30) {
    return { valid: false, error: 'Username must be 3–30 characters.' };
  }

  if (!USERNAME_REGEX.test(normalized)) {
    return { valid: false, error: 'Use lowercase letters, numbers, underscores, or hyphens only.' };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return { valid: false, error: 'This username is reserved.' };
  }

  return { valid: true };
}

export function suggestUsernames(username: string, count = 4): string[] {
  const base = normalizeUsername(username).replace(/[^a-z0-9]/g, '').slice(0, 20);
  if (!base) return [];

  const candidates = [
    `${base}01`,
    `its${base}`,
    `${base}dev`,
    `${base}sarkar`,
    `${base}-profile`,
    `hey${base}`,
    `${base}2026`,
  ];

  return [...new Set(candidates)]
    .filter((candidate) => USERNAME_REGEX.test(candidate) && !RESERVED_USERNAMES.has(candidate))
    .slice(0, count);
}
