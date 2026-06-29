import type { SupabaseClient } from '@supabase/supabase-js';

export function getAuthCallbackUrl(next = '/onboarding') {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signInWithOAuth(
  supabase: SupabaseClient,
  provider: 'google' | 'github',
  next = '/onboarding'
) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: getAuthCallbackUrl(next) },
  });
}
