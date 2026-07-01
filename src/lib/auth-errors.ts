import type { AuthError } from '@supabase/supabase-js';

export function isAuthRateLimitError(error: Pick<AuthError, 'message' | 'code'> | null | undefined) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'over_email_send_rate_limit' ||
    error.code === 'over_request_rate_limit' ||
    message.includes('rate limit') ||
    message.includes('too many requests')
  );
}

export function isAlreadyRegisteredError(error: Pick<AuthError, 'message' | 'code'> | null | undefined) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === 'user_already_exists' ||
    message.includes('already registered') ||
    message.includes('already been registered')
  );
}

export function formatAuthError(error: Pick<AuthError, 'message' | 'code'> | null | undefined) {
  if (!error) return 'Authentication failed.';
  if (isAuthRateLimitError(error)) {
    return 'Too many sign-up emails were sent. Wait a few minutes, then sign in if you already created an account — or continue with Google.';
  }
  return error.message || 'Authentication failed.';
}
