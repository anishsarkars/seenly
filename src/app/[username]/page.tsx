import type { Metadata } from 'next';
import { getProfileByUsername } from '@/db/actions';
import ProfileClient from '@/components/profile/ProfileClient';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profileData = await getProfileByUsername(username);

  if (!profileData || profileData.user.isPublic === false) {
    return { title: 'Profile • Seenly' };
  }

  const { user } = profileData;
  const displayName = user.fullName || user.username;
  const description = user.headline
    ? `Watch ${displayName}'s professional introduction, projects and experience.`
    : `Watch ${displayName}'s professional introduction on Seenly.`;

  return {
    title: `${displayName} • Seenly`,
    description,
    openGraph: {
      title: `${displayName} • Seenly`,
      description,
      type: 'profile',
      images: user.thumbnailUrl ? [{ url: user.thumbnailUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} • Seenly`,
      description,
      images: user.thumbnailUrl ? [user.thumbnailUrl] : undefined,
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profileData = await getProfileByUsername(username);

  if (!profileData) {
    notFound();
  }

  if (!profileData) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const isOwner = authUser?.id === profileData.user.id;

  if (profileData.user.isPublic === false && !isOwner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
        <h1 className="text-2xl font-bold tracking-tight">This profile is private.</h1>
        <p className="mt-2 max-w-sm text-sm text-white/50">
          The owner has chosen not to share this profile publicly.
        </p>
      </div>
    );
  }

  return <ProfileClient profileData={profileData} isOwner={isOwner} />;
}
