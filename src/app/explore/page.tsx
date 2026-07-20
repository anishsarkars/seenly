import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import SeenlyLogo from '@/components/SeenlyLogo';
import SiteFooter from '@/components/SiteFooter';
import { listPublicProfiles } from '@/db/actions';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Explore profiles · Seenly',
  description: 'Browse and search public video profiles on Seenly.',
};

export const dynamic = 'force-dynamic';

type ExplorePageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.trim() : '';
  const { profiles, total } = await listPublicProfiles({
    query: query || undefined,
    limit: 48,
    preferVideo: true,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-dvh flex-col bg-black font-geist text-white">
      <header className="relative z-30 flex items-center justify-between px-5 py-5 sm:px-6 md:px-12 lg:px-16">
        <Link href="/">
          <SeenlyLogo size="md" />
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/onboarding"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Get started
            </Link>
          )}
        </div>
      </header>

      <main className="relative flex-1 px-5 pb-20 pt-6 sm:px-6 md:px-12 lg:px-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-medium uppercase tracking-widest text-white/40">Directory</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Explore profiles</h1>
          <p className="mt-2 max-w-xl text-sm text-white/50 sm:text-base">
            Search public Seenly profiles by name, username, headline, or location.
          </p>

          <form action="/explore" method="get" className="relative mt-8 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search people…"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-28 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.06]"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition-transform hover:scale-[1.02]"
            >
              Search
            </button>
          </form>

          <p className="mt-6 text-sm text-white/40">
            {total === 0
              ? query
                ? `No profiles match “${query}”.`
                : 'No public profiles yet.'
              : `${total} profile${total === 1 ? '' : 's'}${query ? ` for “${query}”` : ''}`}
          </p>

          {profiles.length > 0 ? (
            <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile) => {
                const name = profile.fullName || profile.username;
                const poster = profile.thumbnailUrl || profile.avatar || '/avatars/minimal-1.svg';
                return (
                  <li key={profile.id}>
                    <Link
                      href={`/${profile.username}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
                        <img
                          src={poster}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                        {profile.videoUrl && (
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/90">
                            Video
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={profile.avatar || '/avatars/minimal-1.svg'}
                            alt=""
                            className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{name}</p>
                            <p className="truncate text-xs text-white/45">@{profile.username}</p>
                          </div>
                        </div>
                        {profile.headline && (
                          <p className="mt-2 line-clamp-2 text-sm text-white/55">{profile.headline}</p>
                        )}
                        {profile.location && (
                          <p className="mt-auto pt-2 text-xs text-white/35">{profile.location}</p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
              <p className="text-sm text-white/50">
                {query ? 'Try a different search, or browse everyone.' : 'Be the first to publish a public profile.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {query && (
                  <Link
                    href="/explore"
                    className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5"
                  >
                    Clear search
                  </Link>
                )}
                <Link
                  href="/onboarding"
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                >
                  Create your profile
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter variant={user ? 'member' : 'guest'} compact className="border-t border-white/10" />
    </div>
  );
}
