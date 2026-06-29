'use client';

import React, { useMemo } from 'react';
import PhoneFrame, { PHONE_OUTER_WIDTH } from '@/components/profile/PhoneFrame';
import ProfileView, { type ProfileViewData } from '@/components/profile/ProfileView';
import { DEFAULT_PROFILE_AVATAR } from '@/lib/profile-avatars';

const HERO_PHONE_WIDTH = 248;
const HERO_SCALE = HERO_PHONE_WIDTH / PHONE_OUTER_WIDTH;

const DEMO_PROFILE: ProfileViewData = {
  user: {
    username: 'anish',
    fullName: 'Anish Sarkar',
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

interface HeroPhonePreviewProps {
  cardRef: React.RefObject<HTMLAnchorElement | null>;
}

export default function HeroPhonePreview({ cardRef }: HeroPhonePreviewProps) {
  const profileData = useMemo(() => DEMO_PROFILE, []);

  return (
    <div className="hidden items-center justify-end pr-2 lg:flex xl:pr-10">
      <a
        ref={cardRef}
        href="/anish"
        className="relative block animate-[fadeSlideUp_0.9s_ease_0.5s_both]"
        style={{ willChange: 'transform', width: HERO_PHONE_WIDTH }}
      >
        <div className="pointer-events-none absolute -inset-8 rounded-full bg-white/[0.04] blur-3xl" aria-hidden />
        <PhoneFrame scale={HERO_SCALE} maxScreenHeight="420px">
          <ProfileView profileData={profileData} preview layout="mobile" embedded />
        </PhoneFrame>
      </a>
    </div>
  );
}
