import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SeenlyLogo from '@/components/SeenlyLogo';
import PricingCards, { PricingPageFooter } from '@/components/billing/PricingCards';
import SiteFooter from '@/components/SiteFooter';
import { getUserProfile } from '@/db/actions';
import { getEffectiveTier } from '@/lib/plans';

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentTier: 'free' | 'pro' | 'founder' = 'free';
  if (user) {
    const profile = await getUserProfile(user.id);
    currentTier = getEffectiveTier({
      plan: profile?.user?.plan,
      planStatus: profile?.user?.planStatus,
      planExpiresAt: profile?.user?.planExpiresAt,
      isFounder: profile?.user?.isFounder,
    });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-black font-geist text-white">
      <header className="border-b border-white/[0.06] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href="/">
            <SeenlyLogo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="text-sm text-white/60 hover:text-white">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/60 hover:text-white">
                  Sign in
                </Link>
                <Link
                  href="/onboarding"
                  className="rounded-lg bg-white px-3.5 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/55">
            Pricing
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple plans for every stage
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50 sm:text-base">
            Start free. Upgrade when you need longer videos, bigger uploads, and a cleaner public profile.
          </p>
        </div>

        <div className="mt-12">
          <PricingCards currentTier={currentTier} isSignedIn={!!user} />
        </div>

        <div className="mt-10">
          <PricingPageFooter />
        </div>
      </main>

      <SiteFooter variant={user ? 'member' : 'guest'} compact className="border-t border-white/[0.06]" />
    </div>
  );
}
