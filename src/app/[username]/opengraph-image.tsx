import { getProfileByUsername } from '@/db/actions';
import { PROFILE_OG_SIZE } from '@/lib/profile-og';
import { renderProfileOgImage } from '@/lib/render-profile-og';

export const runtime = 'nodejs';
export const alt = 'Seenly profile';
export const size = PROFILE_OG_SIZE;
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

export default async function ProfileOgImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  const handle = profile?.user?.username || username;
  const displayName = profile?.user?.fullName || handle;
  const headline =
    profile?.user?.headline?.slice(0, 120) || 'Video-first professional profile on Seenly';

  return renderProfileOgImage({ handle, displayName, headline });
}
