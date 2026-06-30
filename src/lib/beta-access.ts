export const BETA_ACCESS_COOKIE = 'seenly_beta';

export function isBetaAccessRequired() {
  return !!process.env.SEENLY_BETA_ACCESS_CODE?.trim();
}

export function isValidBetaAccessCode(code: string) {
  const expected = process.env.SEENLY_BETA_ACCESS_CODE?.trim();
  if (!expected) return true;
  return code.trim() === expected;
}
