import React from 'react';
import { getProfileByUsername } from '@/db/actions';
import ProfileClient from '@/components/profile/ProfileClient';
import { notFound } from 'next/navigation';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profileData = await getProfileByUsername(username);

  if (!profileData) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="h-16 w-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center font-bold text-2xl mb-6">?</div>
        <h1 className="text-2xl font-extrabold tracking-tight">seenly.tech/{username} is available!</h1>
        <p className="text-zinc-500 text-sm max-w-sm mt-2 mb-6">
          This username has not been claimed yet. Create your profile and share your story in under a minute.
        </p>
        <a 
          href="/onboarding"
          className="bg-white text-black px-6 py-2.5 rounded-xl font-semibold hover:bg-zinc-200 transition-all text-sm"
        >
          Claim seenly.tech/{username}
        </a>
      </div>
    );
  }

  return <ProfileClient profileData={profileData} />;
}
