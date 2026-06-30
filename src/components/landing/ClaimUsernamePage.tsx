'use client';

import Link from 'next/link';
import SeenlyLogo from '@/components/SeenlyLogo';
import UsernameClaimBar from '@/components/landing/UsernameClaimBar';
import SiteFooter from '@/components/SiteFooter';
import { normalizeUsername, validateUsername } from '@/lib/username';

interface ClaimUsernamePageProps {
  username: string;
}

export default function ClaimUsernamePage({ username }: ClaimUsernamePageProps) {
  const normalized = normalizeUsername(username).slice(0, 30);
  const hasSlug = normalized.length > 0;
  const validation = hasSlug ? validateUsername(normalized) : { valid: false as const };

  return (
    <div className="flex min-h-screen flex-col bg-black font-geist text-white selection:bg-white selection:text-black">
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-6 md:px-12">
        <SeenlyLogo size="md" />
        <Link
          href="/login"
          className="text-sm text-white/55 transition-colors hover:text-white"
        >
          Sign in
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03] blur-3xl" />
        </div>

        <div className="relative w-full max-w-xl space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
              {hasSlug ? 'This link is open' : 'Available on Seenly'}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {hasSlug ? (
                <>
                  Claim{' '}
                  <span className="text-white/70">
                    seenly.tech/<span className="text-white">{normalized}</span>
                  </span>
                </>
              ) : (
                'Claim your Seenly link'
              )}
            </h1>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/50">
              {hasSlug
                ? validation.valid
                  ? 'Create your video-first profile and make this link yours.'
                  : 'Adjust the username below if needed — availability updates in real time.'
                : 'Pick a username and publish your intro in minutes.'}
            </p>
          </div>

          <UsernameClaimBar
            variant="cta"
            className="px-0"
            initialUsername={normalized}
            title=""
          />

          {hasSlug && !validation.valid && validation.error && (
            <p className="text-xs text-white/40">{validation.error}</p>
          )}

          <p className="text-xs text-white/35">
            Already have an account?{' '}
            <Link href="/login" className="text-white/60 underline-offset-2 hover:text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter variant="guest" />
    </div>
  );
}
