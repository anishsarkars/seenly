import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import { Suspense } from 'react';
import OnboardingClient from '@/components/onboarding/OnboardingClient';

function OnboardingFallback() {
  return <div className="flex h-dvh items-center justify-center bg-black text-white/40 text-sm">Loading…</div>;
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in and has a published profile, skip onboarding
  if (user) {
    const profile = await getUserProfile(user.id);
    if (profile?.user?.username) {
      redirect('/dashboard');
    }
  }

  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingClient />
    </Suspense>
  );
}
