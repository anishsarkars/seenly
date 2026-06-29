import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import OnboardingClient from '@/components/onboarding/OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If already logged in and has a published profile, skip onboarding
  if (user) {
    const profile = await getUserProfile(user.id);
    if (profile?.user?.username) {
      redirect(`/${profile.user.username}`);
    }
  }

  return <OnboardingClient />;
}
