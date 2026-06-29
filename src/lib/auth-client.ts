import type { SupabaseClient } from '@supabase/supabase-js';

export function getAuthCallbackUrl(next = '/onboarding') {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export async function signInWithGoogle(
  supabase: SupabaseClient,
  next = '/onboarding'
) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getAuthCallbackUrl(next) },
  });
}
