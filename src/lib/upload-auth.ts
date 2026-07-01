import { createClient } from '@/utils/supabase/server';
import type { User } from '@supabase/supabase-js';

export async function resolveAuthenticatedUser(request: Request): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return user;

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const {
    data: { user: tokenUser },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !tokenUser) return null;
  return tokenUser;
}
