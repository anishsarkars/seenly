const BUILTIN_DEVELOPER_EMAILS = new Set(['urvakshtirle@gmail.com']);

function extraDeveloperEmails() {
  return (process.env.SEENLY_DEVELOPER_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function hasDeveloperAccess(email?: string | null) {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  if (BUILTIN_DEVELOPER_EMAILS.has(normalized)) return true;
  return extraDeveloperEmails().includes(normalized);
}
