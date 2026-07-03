import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const profile = await getUserProfile(user.id);
        if (profile?.user?.username) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }

        return NextResponse.redirect(`${origin}${safeNext}`);
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
