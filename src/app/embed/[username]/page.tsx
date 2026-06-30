import type { Metadata } from 'next';
import { getProfileByUsername } from '@/db/actions';
import ProfileView from '@/components/profile/ProfileView';
import { getEntitlements } from '@/lib/plans';
import { isProfileEmbeddable } from '@/lib/profile-embed';

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

  if (!profileData) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-black px-6 text-center text-sm text-white/50">
        Profile not found.
      </div>
    );
  }

  if (!isProfileEmbeddable(profileData.user)) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 bg-black px-6 text-center text-sm text-white/50">
        <p>This profile embed is not enabled.</p>
        <p className="text-xs text-white/35">
          Turn on Developer options → embed in your Seenly dashboard.
        </p>
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
