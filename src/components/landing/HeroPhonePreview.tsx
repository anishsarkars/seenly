'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import PhoneFrame, { PHONE_OUTER_WIDTH } from '@/components/profile/PhoneFrame';
import ProfileView, { type ProfileViewData } from '@/components/profile/ProfileView';
import { DEFAULT_PROFILE_AVATAR } from '@/lib/profile-avatars';

const HERO_PHONE_WIDTH = 288;
const HERO_SCALE = HERO_PHONE_WIDTH / PHONE_OUTER_WIDTH;

const DEMO_PROFILE: ProfileViewData = {
  user: {
    username: 'anish',
    fullName: 'Anish',
    headline: 'Builder · Product & Engineering',
    location: 'India',
    avatar: DEFAULT_PROFILE_AVATAR,
    videoUrl: undefined,
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=640&h=360&q=80',
    resumeUrl: '#',
  },
  experiences: [
    { role: 'Founder', company: 'Seenly', duration: '2025–now' },
    { role: 'Software Engineer', company: 'Startup', duration: '2023–2025' },
  ],
  projects: [
    { title: 'Seenly', description: 'Video-first professional profiles.', website: '', github: '' },
  ],
  socials: { linkedin: '#', github: '#', twitter: '#' },
};

export default function HeroPhonePreview() {
  const cardRef = useRef<HTMLDivElement>(null);
  const profileData = useMemo(() => DEMO_PROFILE, []);

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

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      currentX = lerp(currentX, targetX, 0.055);
      currentY = lerp(currentY, targetY, 0.055);
      card.style.transform = `perspective(1000px) rotateY(${currentX}deg) rotateX(${currentY}deg)`;
      animFrame = requestAnimationFrame(animate);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width * 0.9);
      const dy = (e.clientY - cy) / (rect.height * 0.9);
      const dist = Math.hypot(dx, dy);
      const falloff = Math.max(0, 1 - dist * 0.55);
      targetX = dx * 6 * falloff;
      targetY = -dy * 6 * falloff;
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
    <div className="hidden items-center justify-end pr-2 lg:flex xl:pr-10">
      <div
        ref={cardRef}
        className="relative animate-[fadeSlideUp_0.9s_ease_0.5s_both]"
        style={{ willChange: 'transform', width: HERO_PHONE_WIDTH }}
        aria-hidden
      >
        <div
          className="pointer-events-none absolute -bottom-6 left-1/2 h-8 w-32 -translate-x-1/2 rounded-full bg-black/40 blur-xl"
          aria-hidden
        />
        <div className="pointer-events-none absolute -inset-6 rounded-full bg-white/[0.03] blur-3xl" aria-hidden />
        <PhoneFrame scale={HERO_SCALE} maxScreenHeight="460px" className="drop-shadow-[0_40px_80px_rgba(0,0,0,0.65)]">
          <ProfileView profileData={profileData} preview layout="mobile" embedded />
        </PhoneFrame>
      </div>
    </div>
  );
}
