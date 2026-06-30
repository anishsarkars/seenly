import type { Metadata } from 'next';
import { getProfileByUsername } from '@/db/actions';
import ProfileView from '@/components/profile/ProfileView';
import { getEntitlements } from '@/lib/plans';

export const dynamic = 'force-dynamic';

interface EmbedProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: EmbedProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} • Seenly Embed`,
    robots: { index: false, follow: false },
  };
}

export default async function EmbedProfilePage({ params }: EmbedProfilePageProps) {
  const { username } = await params;
  const profileData = await getProfileByUsername(username);

  if (
    !profileData ||
    profileData.user.isPublic === false ||
    !profileData.user.embedEnabled
  ) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-black px-6 text-center text-sm text-white/50">
        This profile embed is not available.
      </div>
    );
  }

  const entitlements = getEntitlements({
    plan: profileData.user.plan,
    planStatus: profileData.user.planStatus,
    planExpiresAt: profileData.user.planExpiresAt,
    isFounder: profileData.user.isFounder,
  });

  return (
    <ProfileView
      profileData={profileData}
      embedded
      layout="mobile"
      removeBranding={entitlements.removeBranding}
      showProBadge={entitlements.showProBadge}
      showFounderBadge={entitlements.showFounderBadge}
    />
  );
}
