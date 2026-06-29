import LoginClient from '@/components/auth/LoginClient';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const profile = await getUserProfile(user.id);
    if (profile?.user?.username) {
      redirect('/dashboard');
    }
    redirect('/onboarding');
  }

  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
