'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SeenlyLogo from '@/components/SeenlyLogo';
import ClaimUsernamePage from '@/components/landing/ClaimUsernamePage';
import SiteFooter from '@/components/SiteFooter';
import { normalizeUsername } from '@/lib/username';

export default function NotFoundClaim() {
  const pathname = usePathname();
  const segment = pathname?.replace(/^\//, '').split('/')[0] ?? '';
  const slug = normalizeUsername(decodeURIComponent(segment)).slice(0, 30);

  if (slug) {
    return <ClaimUsernamePage username={slug} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-black font-geist text-white selection:bg-white selection:text-black">
      <header className="px-5 py-5 sm:px-6 md:px-12">
        <SeenlyLogo size="md" />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Page not found</h1>
        <p className="mt-2 max-w-sm text-sm text-white/50">
          This page doesn&apos;t exist. Claim a username and publish your intro in minutes.
        </p>
        <Link
          href="/onboarding"
          className="mt-6 rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Create your profile
        </Link>
      </main>

      <SiteFooter variant="guest" />
    </div>
  );
}
