import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile, getProfileAnalytics } from '@/db/actions';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, redirect to onboarding login screen
  if (!user) {
    redirect('/onboarding');
  }

  // Fetch the logged-in user's profile and analytics
  const profileData = await getUserProfile(user.id);
  
  // If user signed up but hasn't completed onboarding details, redirect to onboarding
  if (!profileData) {
    redirect('/onboarding');
  }

  const analyticsData = await getProfileAnalytics(user.id);

  return (
    <DashboardClient 
      initialProfile={profileData} 
      initialAnalytics={analyticsData} 
    />
  );
}
