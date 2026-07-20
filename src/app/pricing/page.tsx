import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import SeenlyLogo from '@/components/SeenlyLogo';
import PricingTierGrid, { PricingPageFooter } from '@/components/billing/PricingTierGrid';
import SiteFooter from '@/components/SiteFooter';
import { getUserProfile } from '@/db/actions';
import { getEffectiveTier, isTrialing } from '@/lib/plans';

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentTier: 'free' | 'pro' | 'founder' = 'free';
  let onTrial = false;
  if (user) {
    const profile = await getUserProfile(user.id);
    const fields = {
      plan: profile?.user?.plan,
      planStatus: profile?.user?.planStatus,
      planExpiresAt: profile?.user?.planExpiresAt,
      isFounder: profile?.user?.isFounder,
    };
    currentTier = getEffectiveTier(fields);
    onTrial = isTrialing(fields);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-black font-geist text-white selection:bg-white selection:text-black">
      <header className="relative z-30 flex items-center justify-between px-5 py-5 sm:px-6 md:px-12 lg:px-16">
        <Link href="/">
          <SeenlyLogo size="md" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] sm:px-5"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-white/60 transition-colors hover:text-white">
                Sign in
              </Link>
              <Link
                href="/onboarding"
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] sm:px-5"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="relative bg-black px-5 py-16 text-white sm:px-6 sm:py-24 md:px-12 md:py-28 lg:px-16">
          <PricingTierGrid variant="checkout" currentTier={currentTier} isTrialing={onTrial} isSignedIn={!!user} />
        </section>

        <div className="px-5 pb-16 text-white/50 sm:px-6 md:px-12 lg:px-16">
          <PricingPageFooter />
        </div>
      </main>

      <SiteFooter variant={user ? 'member' : 'guest'} compact className="border-t border-white/10" />
    </div>
  );
}
