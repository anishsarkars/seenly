'use client';

import React, { useMemo } from 'react';
import ProfileLivePreview from '@/components/profile/ProfileLivePreview';
import type { ProfileViewData } from '@/components/profile/ProfileView';
import { useOnboardingPreview } from '@/components/onboarding/useOnboardingPreview';

interface Experience {
  company: string;
  role: string;
  duration: string;
}

interface Project {
  title: string;
  description: string;
  website: string;
  github: string;
}

interface Socials {
  linkedin: string;
  github: string;
  portfolio: string;
  twitter: string;
  website: string;
  email: string;
  phone: string;
}

interface OnboardingProfilePreviewProps {
  username: string;
  fullName: string;
  headline: string;
  location: string;
  bio: string;
  selectedAvatar: string;
  videoPreviewUrl: string | null;
  resumeFile: File | null;
  experiences: Experience[];
  projects: Project[];
  socials: Socials;
}

export default function OnboardingProfilePreview(props: OnboardingProfilePreviewProps) {
  const preview = useOnboardingPreview();

  const profileData = useMemo<ProfileViewData>(() => {
    const filledSocials = Object.fromEntries(
      Object.entries(props.socials).filter(([, value]) => value.trim() !== '')
    );

    return {
      user: {
        username: props.username || 'username',
        fullName: props.fullName || undefined,
        headline: props.headline || undefined,
        location: props.location || undefined,
        bio: props.bio || undefined,
        avatar: props.selectedAvatar,
        videoUrl: props.videoPreviewUrl || undefined,
        resumeUrl: props.resumeFile ? 'local' : undefined,
      },
      experiences: props.experiences.filter((e) => e.company.trim() && e.role.trim()),
      projects: props.projects.filter((p) => p.title.trim()),
      socials: filledSocials,
    };
  }, [props]);

  return (
    <aside
      className={`relative hidden min-h-0 shrink-0 flex-col overflow-hidden border-l border-white/10 bg-black lg:flex ${
        preview.isDragging ? 'transition-none' : 'transition-[width] duration-200'
      }`}
      style={{ width: preview.width }}
    >
      <ProfileLivePreview
        profileData={profileData}
        username={props.username}
        defaultLayout="mobile"
        alwaysVisible
        panelMode="side"
        className="min-h-0 min-w-0 flex-1"
      />
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize preview"
        onMouseDown={preview.onResizeStart}
        className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-white/15 active:bg-white/25"
      />
    </aside>
  );
}
