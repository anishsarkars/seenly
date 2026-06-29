'use client';

import React, { useMemo } from 'react';
import ProfileLivePreview from '@/components/profile/ProfileLivePreview';
import type { ProfileViewData } from '@/components/profile/ProfileView';

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
    <>
      {/* Desktop — side panel */}
      <ProfileLivePreview
        profileData={profileData}
        username={props.username}
        defaultLayout="mobile"
        panelMode="side"
        className="hidden min-h-0 min-w-0 flex-1 border-l border-white/10 bg-[#0a0a0a] lg:flex"
      />

      {/* Mobile — app-style bottom preview */}
      <div className="flex h-[min(42dvh,400px)] min-h-[240px] shrink-0 flex-col overflow-hidden border-t border-white/10 bg-[#0a0a0a] lg:hidden">
        <ProfileLivePreview
          profileData={profileData}
          username={props.username}
          defaultLayout="mobile"
          alwaysVisible
          panelMode="bottom"
          className="min-h-0 flex-1"
        />
      </div>
    </>
  );
}
