'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import SeenlyLogo from '@/components/SeenlyLogo';
import UsernameClaimBar from '@/components/landing/UsernameClaimBar';
import HeroPhonePreview from '@/components/landing/HeroPhonePreview';
import SiteFooter from '@/components/SiteFooter';
import { createClient } from '@/utils/supabase/client';
import { getUserProfile } from '@/db/actions';

const steps = [
  {
    label: 'Record intro',
    description: 'A 1-2 Minute pitch — your voice, your story.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
        <rect x="8" y="12" width="32" height="24" rx="2" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
        <path d="M20 12V9M28 12V9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Build profile',
    description: 'Experience, projects, resume — all in one place.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
        <rect x="12" y="8" width="24" height="32" rx="2" stroke="currentColor" strokeWidth="1.25" />
        <circle cx="24" cy="18" r="4" stroke="currentColor" strokeWidth="1.25" />
        <path d="M17 30c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M16 38h16" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Share link',
    description: 'One URL for every application and outreach.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden>
        <path d="M18 22l12-12M30 10h8v8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 22l-12 12M18 34H10v-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="14" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 3" opacity="0.35" />
      </svg>
    ),
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<'loading' | 'guest' | 'member' | 'onboarding'>('loading');
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setAuthState('guest');
        return;
      }
      const profile = await getUserProfile(user.id);
      if (profile?.user?.username) {
        setProfileUsername(profile.user.username);
        setAuthState('member');
      } else {
        setAuthState('onboarding');
      }
    });
  }, []);

  // Subtle cursor-follow tilt on hero phone mockup
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let animFrame: number;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

    const animate = () => {
      currentX = lerp(currentX, targetX, 0.06);
      currentY = lerp(currentY, targetY, 0.06);
      card.style.transform = `perspective(900px) rotateY(${currentX}deg) rotateX(${currentY}deg)`;
      animFrame = requestAnimationFrame(animate);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distX = (e.clientX - cx) / rect.width;
      const distY = (e.clientY - cy) / rect.height;
      const proximity = Math.min(1, Math.hypot(distX, distY) * 1.4);
      targetX = distX * 7 * proximity;
      targetY = -distY * 7 * proximity;
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    animFrame = requestAnimationFrame(animate);
    window.addEventListener('mousemove', onMouseMove);
    card.addEventListener('mouseleave', onLeave);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('mousemove', onMouseMove);
      card.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black font-geist text-white selection:bg-white selection:text-black">

      {/* HERO VIEWPORT SECTION */}
      <section className="relative flex min-h-[115dvh] w-full flex-col justify-between overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover max-sm:object-[center_35%] sm:object-[65%_center]"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064209_0cb7d815-ff61-4caa-a6d5-bbff145ab272.mp4"
            type="video/mp4"
          />
        </video>

        {/* Thin bottom blend into next section — video stays clear */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-20 bg-gradient-to-b from-transparent to-black sm:h-24" />

        {/* Navbar (z-30) */}
        <header className="relative z-30 flex items-center justify-between px-5 py-5 sm:px-6 md:px-12 lg:px-16">
          <div className="flex items-center gap-8">
            <SeenlyLogo size="md" />
            <nav className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">
                How it Works
              </a>
            </nav>
          </div>

          <div className="flex items-center">
            {authState === 'member' ? (
              <a
                href="/dashboard"
                className="hidden rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 md:block"
              >
                Dashboard
              </a>
            ) : authState === 'onboarding' ? (
              <a
                href="/onboarding"
                className="hidden rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 md:block"
              >
                Continue Setup
              </a>
            ) : authState === 'guest' ? (
              <a
                href="/onboarding"
                className="hidden rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 md:block"
              >
                Get Started
              </a>
            ) : null}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative h-10 w-10 flex items-center justify-center text-white focus:outline-none md:hidden z-50 active:scale-90 transition-transform"
              aria-label="Toggle menu"
            >
              <div className="relative h-6 w-6">
                <div className={`absolute inset-0 transition-all duration-300 transform ${mobileMenuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
                  <Menu className="h-6 w-6" />
                </div>
                <div className={`absolute inset-0 transition-all duration-300 transform ${mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}>
                  <X className="h-6 w-6" />
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        <div
          className={`absolute inset-x-0 top-0 z-20 overflow-hidden bg-black/98 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            mobileMenuOpen ? 'min-h-[100dvh] opacity-100' : 'h-0 opacity-0 pointer-events-none'
          }`}
        >
          <div
            className={`flex min-h-[100dvh] flex-col px-6 pt-[4.75rem] pb-10 transition-all duration-500 delay-75 sm:px-8 ${
              mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <nav className="flex flex-1 flex-col justify-center gap-0">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="border-b border-white/[0.06] py-5 text-2xl font-medium tracking-tight text-white/90 transition-colors hover:text-white"
              >
                How it Works
              </a>
              {authState === 'guest' && (
                <a
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-white/[0.06] py-5 text-2xl font-medium tracking-tight text-white/90 transition-colors hover:text-white"
                >
                  Sign in
                </a>
              )}
              {authState === 'member' && profileUsername && (
                <a
                  href={`/${profileUsername}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-white/[0.06] py-5 text-2xl font-medium tracking-tight text-white/90 transition-colors hover:text-white"
                >
                  View profile
                </a>
              )}
            </nav>

            <a
              href={
                authState === 'member'
                  ? '/dashboard'
                  : authState === 'onboarding'
                    ? '/onboarding'
                    : '/onboarding'
              }
              onClick={() => setMobileMenuOpen(false)}
              className="mt-8 flex w-full items-center justify-center rounded-full bg-white px-8 py-4 text-base font-semibold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {authState === 'member'
                ? 'Dashboard'
                : authState === 'onboarding'
                  ? 'Continue Setup'
                  : 'Get Started'}
            </a>
          </div>
        </div>

        {/* Hero Content (z-10) — Two column layout */}
        <main className="relative z-10 flex flex-1 items-center justify-between px-5 pb-10 pt-4 sm:px-6 md:px-12 lg:px-20">

          {/* LEFT: Text */}
          <div className="flex w-full max-w-xl flex-col justify-center gap-5 lg:w-auto">
            {/* Badge */}
            <div className="animate-[fadeSlideUp_0.8s_ease_0.2s_both]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/70 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Personal Video Pitch
              </span>
            </div>

            {/* Heading */}
            <h1 className="animate-[fadeSlideUp_0.8s_ease_0.4s_both] text-4xl font-bold leading-[1.06] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.55)] sm:text-5xl md:text-6xl">
              Your Resume Tells.<br />
              <span className="text-white/75">Your Intro Shows.</span>
            </h1>

            {/* Description */}
            <p className="max-w-sm animate-[fadeSlideUp_0.8s_ease_0.6s_both] text-sm leading-relaxed text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] md:text-base">
              Record a 60-second intro, build your profile, and share one link with every recruiter.
            </p>

            {/* Username claim — guests only */}
            {authState === 'guest' && (
              <div className="animate-[fadeSlideUp_0.8s_ease_0.65s_both] w-full max-w-md">
                <UsernameClaimBar variant="hero" title="" className="!max-w-none" />
              </div>
            )}

            {authState === 'member' && profileUsername && (
              <div className="animate-[fadeSlideUp_0.8s_ease_0.65s_both]">
                <a
                  href={`/${profileUsername}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:border-white/25 hover:text-white"
                >
                  <span className="text-white/45">seenly.tech/</span>
                  <span className="font-semibold text-white">{profileUsername}</span>
                </a>
              </div>
            )}

            {authState === 'onboarding' && (
              <div className="animate-[fadeSlideUp_0.8s_ease_0.65s_both]">
                <p className="text-sm text-white/60 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
                  Pick up where you left off — finish your profile in a few steps.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex animate-[fadeSlideUp_0.8s_ease_0.75s_both] w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              {authState === 'member' ? (
                <>
                  <a
                    href="/dashboard"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105 sm:w-auto"
                  >
                    Dashboard
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  {profileUsername && (
                    <a
                      href={`/${profileUsername}`}
                      className="w-full rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/8 hover:text-white sm:w-auto text-center"
                    >
                      View Live Profile
                    </a>
                  )}
                </>
              ) : authState === 'onboarding' ? (
                <>
                  <a
                    href="/onboarding"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105 sm:w-auto"
                  >
                    Continue Setup
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/onboarding"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-105 sm:w-auto"
                  >
                    Create Your Intro
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => alert('Demo video player modal!')}
                    className="w-full rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/8 hover:text-white sm:w-auto"
                  >
                    ▶ Watch Demo
                  </button>
                </>
              )}
            </div>
          </div>

          <HeroPhonePreview cardRef={cardRef} />

        </main>

        {/* Floating animation keyframes */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: perspective(900px) rotateY(-4deg) rotateX(2deg) translateY(0px); }
            50% { transform: perspective(900px) rotateY(-4deg) rotateX(2deg) translateY(-10px); }
          }
          @keyframes sectionGlow {
            0%, 100% { opacity: 0.35; transform: scaleX(0.92); }
            50% { opacity: 0.9; transform: scaleX(1); }
          }
          @keyframes claimGlow {
            0%, 100% { opacity: 0.4; transform: scale(0.9); }
            50% { opacity: 0.85; transform: scale(1.08); }
          }
          @keyframes claimGlowAlt {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50% { opacity: 0.65; transform: scale(1.15); }
          }
          @keyframes claimGlowRing {
            0%, 100% { opacity: 0.3; transform: scale(0.98); }
            50% { opacity: 0.7; transform: scale(1.02); }
          }
          @keyframes claimGradientSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </section>

      {/* Subtle animated divider */}
      <div className="relative h-px w-full overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        <div className="absolute inset-y-0 left-1/2 h-full w-2/3 -translate-x-1/2 animate-[sectionGlow_6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/15 to-transparent blur-[0.5px]" />
      </div>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative bg-black px-5 py-20 sm:px-6 sm:py-28 md:px-12 md:py-36 lg:px-16">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-16 text-center sm:gap-20 md:gap-24">
          <div className="space-y-4 sm:space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
              How it works
            </span>
            <h2 className="text-2xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
              Three steps to your profile.<br />
              <span className="text-white/60">One link to share everywhere.</span>
            </h2>
          </div>

          <div className="grid w-full grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8">
            {steps.map((step) => (
              <div key={step.label} className="flex flex-col items-center gap-4 sm:gap-5">
                <div className="text-white/50">{step.icon}</div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold tracking-tight text-white">{step.label}</p>
                  <p className="mx-auto max-w-xs px-2 text-sm leading-relaxed text-white/50 sm:max-w-[12rem] sm:px-0">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="w-full max-w-md rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm leading-relaxed text-white/50 backdrop-blur-sm sm:w-auto sm:px-6">
            From one intro to your{' '}
            <span className="font-semibold text-white/80">seenly.tech</span>
            {' '}link
          </div>
        </div>
      </section>

      {/* Claim username — bottom CTA above footer */}
      {authState === 'guest' && (
        <section className="relative overflow-hidden border-t border-white/[0.06] bg-zinc-950 px-5 py-20 sm:px-6 sm:py-28 md:px-12 md:py-32 lg:px-16">
          {/* Section background */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(255,255,255,0.04),transparent_70%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-zinc-950/80 to-black"
            aria-hidden
          />

          {/* Animated glow layers */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="h-72 w-full max-w-3xl animate-[claimGlow_8s_ease-in-out_infinite] rounded-full bg-white/[0.07] blur-[100px]" />
            <div className="absolute h-52 w-[28rem] animate-[claimGlowAlt_6s_ease-in-out_infinite_0.75s] rounded-full bg-emerald-400/[0.12] blur-[88px]" />
            <div className="absolute h-36 w-72 animate-[claimGlow_11s_ease-in-out_infinite_1.5s] rounded-full bg-violet-400/[0.06] blur-[64px]" />
          </div>

          <div className="relative mx-auto flex min-h-[min(320px,50vh)] max-w-4xl flex-col items-center justify-center px-2">
            <div className="relative w-full max-w-xl">
              <div
                className="pointer-events-none absolute -inset-8 animate-[claimGlowRing_5s_ease-in-out_infinite] rounded-[2.5rem] bg-gradient-to-b from-emerald-400/20 via-white/10 to-violet-400/10 blur-3xl"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-3xl p-[1px]">
                <div
                  className="pointer-events-none absolute -inset-[100%] animate-[claimGradientSpin_10s_linear_infinite] opacity-80"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.45) 18%, transparent 36%, rgba(255,255,255,0.25) 54%, transparent 72%, rgba(139,92,246,0.35) 88%, transparent 100%)',
                  }}
                  aria-hidden
                />
                <div className="relative rounded-[calc(1.5rem-1px)] border border-white/[0.08] bg-black/60 px-5 py-9 shadow-[0_0_100px_-20px_rgba(16,185,129,0.35)] backdrop-blur-md sm:px-9 sm:py-11">
                  <div
                    className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
                    aria-hidden
                  />
                  <UsernameClaimBar variant="cta" className="relative w-full px-0" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <SiteFooter
        variant={
          authState === 'member'
            ? 'member'
            : authState === 'onboarding'
              ? 'onboarding'
              : 'guest'
        }
        username={profileUsername}
      />

    </div>
  );
}
