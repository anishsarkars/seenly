'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Share2, MapPin, ExternalLink,
  Mail, Globe,
} from 'lucide-react';
import { isPersistedMediaUrl } from '@/lib/storage';
import { logAnalyticEvent } from '@/db/actions';
import GoldenVerifiedTick from '@/components/profile/GoldenVerifiedTick';
import ProVerifiedTick from '@/components/profile/ProVerifiedTick';

export interface ProfileViewData {
  user: {
    id?: string;
    username?: string;
    fullName?: string;
    headline?: string;
    location?: string;
    bio?: string;
    avatar?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    resumeUrl?: string;
    plan?: string | null;
    planStatus?: string | null;
    planExpiresAt?: Date | string | null;
    isFounder?: boolean | null;
  };
  experiences: Array<{ role: string; company: string; duration: string }>;
  projects: Array<{ title: string; description: string; website?: string; github?: string }>;
  socials: Record<string, string | undefined>;
}

interface ProfileViewProps {
  profileData: ProfileViewData;
  preview?: boolean;
  layout?: 'mobile' | 'desktop';
  embedded?: boolean;
  removeBranding?: boolean;
  showProBadge?: boolean;
  showFounderBadge?: boolean;
}

function IntroVideo({
  videoUrl,
  thumbnailUrl,
  preview,
  userId,
  onPlay,
  className = '',
  maxHeightClass = 'max-h-[75dvh]',
}: {
  videoUrl?: string;
  thumbnailUrl?: string;
  preview: boolean;
  userId?: string;
  onPlay?: () => void;
  className?: string;
  maxHeightClass?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  const canPlay = !!videoUrl && (preview || isPersistedMediaUrl(videoUrl));

  const handleMetadata = (video: HTMLVideoElement) => {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
    setVideoReady(true);
  };

  if (!canPlay && preview && thumbnailUrl) {
    return (
      <div
        className={`relative w-full overflow-hidden bg-black ${maxHeightClass} ${className}`}
        style={{ aspectRatio }}
      >
        <img src={thumbnailUrl} alt="" className="h-full w-full object-contain" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg">
            <div className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-black" />
          </div>
        </div>
      </div>
    );
  }

  if (!canPlay) {
    return (
      <div
        className={`flex w-full items-center justify-center bg-zinc-950 px-6 text-center text-sm text-zinc-500 ${className}`}
        style={{ aspectRatio: 16 / 9 }}
      >
        No intro video yet.
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden bg-black ${maxHeightClass} ${className}`}
      style={{ aspectRatio }}
    >
      {thumbnailUrl && !videoReady && (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          fetchPriority="high"
        />
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        className="relative h-full w-full object-contain"
        controls
        playsInline
        preload="auto"
        onLoadedMetadata={(e) => handleMetadata(e.currentTarget)}
        onPlay={onPlay}
      />
    </div>
  );
}

export default function ProfileView({
  profileData,
  preview = false,
  layout,
  embedded = false,
  removeBranding = false,
  showProBadge = false,
  showFounderBadge = false,
}: ProfileViewProps) {
  const { user, experiences, projects, socials } = profileData;
  const [hasLoggedPlay, setHasLoggedPlay] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPublicProfile = !embedded && !preview;
  const isDesktopLayout = layout === 'desktop';
  const isMobileLayout = layout === 'mobile';

  useEffect(() => {
    if (preview || !user.thumbnailUrl) return;
    const img = new Image();
    img.src = user.thumbnailUrl;
  }, [preview, user.thumbnailUrl]);

  useEffect(() => {
    if (preview || !user.videoUrl || user.videoUrl.startsWith('blob:')) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = user.videoUrl;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [preview, user.videoUrl]);

  const handleDownloadResume = () => {
    if (preview || !user.resumeUrl || user.resumeUrl === '#') return;
    logAnalyticEvent(user.id!, 'downloads');
    window.open(user.resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${user.fullName || user.username}'s Seenly profile`;

  const handleShare = async () => {
    if (preview) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareText, url: profileUrl });
        return;
      } catch {
        // clipboard fallback
      }
    }
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVideoPlay = () => {
    if (preview || !user.id || hasLoggedPlay) return;
    logAnalyticEvent(user.id, 'plays');
    setHasLoggedPlay(true);
  };

  const displayName = user.fullName || user.username || 'Your Name';
  const displayHeadline = user.headline || 'Your professional headline';
  const displayLocation = user.location || 'Location';

  const socialLinks = [
    socials?.linkedin && { href: socials.linkedin, label: 'LinkedIn', icon: 'linkedin' as const },
    socials?.github && { href: socials.github, label: 'GitHub', icon: 'github' as const },
    socials?.twitter && { href: socials.twitter, label: 'Twitter', icon: 'twitter' as const },
    socials?.website && { href: socials.website, label: 'Website', icon: 'globe' as const },
    socials?.portfolio && { href: socials.portfolio, label: 'Portfolio', icon: 'globe' as const },
    socials?.email && { href: `mailto:${socials.email}`, label: 'Email', icon: 'mail' as const },
  ].filter(Boolean) as Array<{ href: string; label: string; icon: 'linkedin' | 'github' | 'twitter' | 'globe' | 'mail' }>;

  if (isPublicProfile) {
    return (
      <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
          <IntroVideo
            videoUrl={user.videoUrl}
            thumbnailUrl={user.thumbnailUrl}
            preview={preview}
            userId={user.id}
            onPlay={handleVideoPlay}
            className="rounded-2xl ring-1 ring-white/[0.06]"
          />

          <div className="mt-6 flex items-start gap-3 sm:gap-4">
            {user.avatar && (
              <img
                src={user.avatar}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-white/10 sm:h-12 sm:w-12"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{displayName}</h1>
                {showFounderBadge && <GoldenVerifiedTick size="md" />}
                {!showFounderBadge && showProBadge && <ProVerifiedTick size="md" />}
              </div>
              <p className="mt-1 text-sm text-zinc-400">{displayHeadline}</p>
              {user.location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {displayLocation}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Share'}
            </button>
            {user.resumeUrl && user.resumeUrl !== '#' && (
              <button
                type="button"
                onClick={handleDownloadResume}
                className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                <FileText className="h-3.5 w-3.5" />
                Resume
              </button>
            )}
          </div>

          {user.bio && (
            <p className="mt-6 text-sm leading-relaxed text-zinc-400">{user.bio}</p>
          )}

          {experiences.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                Experience
              </h2>
              <ul className="space-y-4">
                {experiences.map((exp, idx) => (
                  <li key={idx} className="border-l border-zinc-800 pl-4">
                    <p className="text-sm font-medium text-white">{exp.role}</p>
                    <p className="text-xs text-zinc-500">
                      {exp.company}
                      {exp.duration ? ` · ${exp.duration}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {projects.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
                Projects
              </h2>
              <ul className="space-y-3">
                {projects.map((proj, idx) => (
                  <li
                    key={idx}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <p className="text-sm font-medium text-white">{proj.title}</p>
                    {proj.description && (
                      <p className="mt-1 text-xs leading-relaxed text-zinc-500">{proj.description}</p>
                    )}
                    <div className="mt-2 flex gap-3">
                      {proj.website && (
                        <a
                          href={proj.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white"
                        >
                          Site <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {proj.github && (
                        <a
                          href={proj.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white"
                        >
                          GitHub <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {socialLinks.length > 0 && (
            <section className="mt-10 flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.icon === 'mail' ? undefined : '_blank'}
                  rel={link.icon === 'mail' ? undefined : 'noopener noreferrer'}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-white/15 hover:text-white"
                >
                  {link.icon === 'mail' && <Mail className="h-3 w-3" />}
                  {link.icon === 'globe' && <Globe className="h-3 w-3" />}
                  {link.label}
                </a>
              ))}
            </section>
          )}

          {!removeBranding && (
            <footer className="mt-14 flex justify-center pb-6">
              <Link
                href="/onboarding"
                className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
              >
                Built with <span className="text-zinc-400">seenly.tech</span>
              </Link>
            </footer>
          )}
        </div>
      </div>
    );
  }

  // Embedded / dashboard preview layout
  const gridClass = isDesktopLayout
    ? 'grid grid-cols-12 gap-8 items-start'
    : isMobileLayout
      ? 'grid grid-cols-1 gap-6 items-start'
      : 'grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start';

  const sidebarClass = isDesktopLayout
    ? 'col-span-4 flex flex-col items-start text-left space-y-6 sticky top-6'
    : isMobileLayout
      ? 'col-span-1 flex flex-col items-center text-center space-y-5'
      : 'md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-6 md:sticky md:top-24';

  const mainClass = isDesktopLayout
    ? 'col-span-8 space-y-8'
    : isMobileLayout
      ? 'col-span-1 space-y-8'
      : 'md:col-span-8 space-y-10';

  return (
    <div
      className={
        embedded
          ? 'bg-black text-white selection:bg-white selection:text-black'
          : 'min-h-screen bg-black text-white selection:bg-white selection:text-black py-16 md:py-24'
      }
    >
      <div
        className={`mx-auto px-4 sm:px-6 grid ${gridClass} ${
          embedded ? 'max-w-none py-6' : 'max-w-4xl'
        }`}
      >
        <div className={sidebarClass}>
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-zinc-900 ring-1 ring-white/10">
            {user.avatar ? (
              <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-2xl font-bold">
                {user.username?.slice(0, 2).toUpperCase() || '??'}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
              <h1 className="text-xl font-bold tracking-tight">{displayName}</h1>
              {showFounderBadge && <GoldenVerifiedTick size="lg" />}
              {!showFounderBadge && showProBadge && <ProVerifiedTick size="lg" />}
            </div>
            <p className="text-sm text-zinc-400">{displayHeadline}</p>
            {(user.location || preview) && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="h-3 w-3" /> {displayLocation}
              </span>
            )}
          </div>
        </div>

        <div className={mainClass}>
          <IntroVideo
            videoUrl={user.videoUrl}
            thumbnailUrl={user.thumbnailUrl}
            preview={preview}
            userId={user.id}
            onPlay={handleVideoPlay}
            className="rounded-xl ring-1 ring-white/10"
            maxHeightClass={embedded ? 'max-h-[50vh]' : 'max-h-[60vh]'}
          />

          {(user.bio || preview) && (
            <p className="text-sm leading-relaxed text-zinc-400">
              {user.bio || 'Write a brief description about your expertise and drive.'}
            </p>
          )}

          {experiences.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">Experience</h3>
              <ul className="space-y-3 border-l border-zinc-900 pl-4">
                {experiences.map((exp, idx) => (
                  <li key={idx}>
                    <p className="text-sm font-medium">{exp.role}</p>
                    <p className="text-xs text-zinc-500">{exp.company}{exp.duration ? ` · ${exp.duration}` : ''}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {projects.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600">Projects</h3>
              <div className="space-y-2">
                {projects.map((proj, idx) => (
                  <div key={idx} className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-4">
                    <p className="text-sm font-medium">{proj.title}</p>
                    {proj.description && <p className="mt-1 text-xs text-zinc-500">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!embedded && !removeBranding && (
        <footer className="px-6 pb-12 pt-10">
          <div className="mx-auto max-w-4xl flex justify-center">
            <Link href="/onboarding" className="text-xs text-zinc-600 hover:text-zinc-400">
              Built with <span className="text-zinc-400">seenly.tech</span>
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}
