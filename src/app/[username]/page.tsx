import type { Metadata } from 'next';
import { getProfileByUsername } from '@/db/actions';
import ProfileClient from '@/components/profile/ProfileClient';
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { getProfileOgImageUrl, PROFILE_OG_SIZE } from '@/lib/profile-og';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://seenly.tech';

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
  const profileUrl = `${APP_URL}/${user.username}`;
  const ogImage = getProfileOgImageUrl(user.username!);

  return {
    title: `${displayName} • Seenly`,
    description,
    metadataBase: new URL(APP_URL),
    alternates: { canonical: profileUrl },
    openGraph: {
      title: `${displayName} • Seenly`,
      description,
      type: 'website',
      url: profileUrl,
      siteName: 'Seenly',
      locale: 'en_US',
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: PROFILE_OG_SIZE.width,
          height: PROFILE_OG_SIZE.height,
          alt: `${displayName} on Seenly`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} • Seenly`,
      description,
      images: [ogImage],
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
