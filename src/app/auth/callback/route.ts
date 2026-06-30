import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import { NextResponse } from 'next/server';
import { BETA_ACCESS_COOKIE, isBetaAccessRequired } from '@/lib/beta-access';

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
        if (safeNext === '/pricing') {
          return NextResponse.redirect(`${origin}/pricing`);
        }

        const profile = await getUserProfile(user.id);
        if (profile?.user?.username) {
          return NextResponse.redirect(`${origin}/dashboard`);
        }

        if (isBetaAccessRequired()) {
          const betaCookie = request.headers.get('cookie')?.includes(`${BETA_ACCESS_COOKIE}=1`);
          const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
          const isNewAccount = Date.now() - createdAt < 15 * 60 * 1000;

          if (isNewAccount && !betaCookie) {
            await supabase.auth.signOut();
            return NextResponse.redirect(`${origin}/onboarding?beta=required`);
          }
        }

        return NextResponse.redirect(`${origin}${safeNext}`);
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
