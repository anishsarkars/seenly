import { getProfileByUsername } from '@/db/actions';
import { renderProfileOgImage } from '@/lib/render-profile-og';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const profile = await getProfileByUsername(username);

  if (!profile || profile.user.isPublic === false) {
    return new Response('Profile not found', { status: 404 });
  }

  const handle = profile.user.username || username;
  const displayName = profile.user.fullName || handle;
  const headline =
    profile.user.headline?.slice(0, 120) || 'Video-first professional profile on Seenly';

  const image = renderProfileOgImage({ handle, displayName, headline });

  return new Response(await image.arrayBuffer(), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
