import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile, getProfileAnalytics } from '@/db/actions';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profileData = await getUserProfile(user.id);

  if (!profileData?.user?.username) {
    redirect('/onboarding');
  }

  const analyticsData = await getProfileAnalytics(user.id);

  return (
    <Suspense fallback={<div className="flex min-h-dvh items-center justify-center bg-black text-white/50">Loading dashboard…</div>}>
      <DashboardClient
        initialProfile={profileData}
        initialAnalytics={analyticsData}
      />
    </Suspense>
  );
}
