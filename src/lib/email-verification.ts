import type { User } from '@supabase/supabase-js';

export function isEmailVerified(user: User | null | undefined) {
  if (!user) return false;
  if (user.email_confirmed_at) return true;
  const provider = user.app_metadata?.provider as string | undefined;
  if (provider && provider !== 'email') return true;
  return false;
}
