'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Share2, MapPin, ExternalLink,
  Mail, Globe, Play, Pause, Volume2, VolumeX,
} from 'lucide-react';
import { isPersistedMediaUrl } from '@/lib/storage';
import { logAnalyticEvent } from '@/db/actions';
import GoldenVerifiedTick from '@/components/profile/GoldenVerifiedTick';
import ProVerifiedTick from '@/components/profile/ProVerifiedTick';
import SeenlyLogo from '@/components/SeenlyLogo';
import ScrollLaunchBadge from '@/components/ScrollLaunchBadge';
import {
  DEFAULT_PROFILE_SECTION_ORDER,
  parseProfileSectionOrder,
  parseProfileTheme,
  type ProfileSectionId,
  type ProfileTheme,
} from '@/lib/profile-customization';

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
    profileTheme?: string | null;
    profileSectionOrder?: string | null;
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
  profileTheme?: ProfileTheme;
  profileSectionOrder?: ProfileSectionId[];
}

function IntroVideo({
  videoUrl,
  thumbnailUrl,
  preview,
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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const canPlay = !!videoUrl && (preview || isPersistedMediaUrl(videoUrl));
  const shellClass = `group relative w-full overflow-hidden bg-black ${className}`;
  const mediaClass = `block w-full h-auto ${maxHeightClass}`;

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((prev) => !prev);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video?.duration) return;
    setProgress(video.currentTime / video.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video?.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio);
  };

  if (!canPlay && preview && thumbnailUrl) {
    return (
      <div className={shellClass}>
        <img src={thumbnailUrl} alt="" className={`${mediaClass} object-contain`} />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
          </div>
        </div>
      </div>
    );
  }

  if (!canPlay) {
    return (
      <div
        className={`flex min-h-[10rem] w-full items-center justify-center px-6 text-center text-sm text-zinc-500 ${shellClass}`}
      >
        No intro video yet.
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {thumbnailUrl && !videoReady && (
        <img
          src={thumbnailUrl}
          alt=""
          className={`${mediaClass} object-contain`}
          fetchPriority="high"
        />
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        className={
          videoReady
            ? `${mediaClass}`
            : `absolute inset-0 h-full w-full ${maxHeightClass} object-contain opacity-0`
        }
        playsInline
        preload="auto"
        muted={muted}
        onLoadedData={() => setVideoReady(true)}
        onCanPlay={() => setVideoReady(true)}
        onPlay={() => {
          setPlaying(true);
          onPlay?.();
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
      />

      {videoReady && (
        <>
          {!playing && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity group-hover:bg-black/35"
              aria-label="Play video"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl backdrop-blur-sm transition-transform hover:scale-105">
                <Play className="ml-1 h-6 w-6 fill-black text-black" />
              </span>
            </button>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <div
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek(e);
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/90"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProfilePublicFooter({ username }: { username?: string }) {
  const handle = username || 'yourusername';

  return (
    <footer className="flex flex-col items-center gap-6 pb-8">
      <Link
        href="/onboarding"
        className="group inline-flex w-full max-w-md flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-4 text-center transition-all hover:border-white/25 hover:bg-white/[0.09] sm:px-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Seenly</p>
        <p className="text-sm font-medium leading-snug text-white/85 group-hover:text-white">
          Claim yours — make your profile
        </p>
        <p className="font-mono text-xs text-white/55 group-hover:text-white/75">
          seenly.tech/{handle}
        </p>
      </Link>
      <ScrollLaunchBadge />
    </footer>
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
  profileTheme: profileThemeProp,
  profileSectionOrder: profileSectionOrderProp,
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

  const profileTheme =
    profileThemeProp ??
    (showFounderBadge ? parseProfileTheme(user.profileTheme) : 'minimal');
  const sectionOrder =
    profileSectionOrderProp ??
    (showFounderBadge
      ? parseProfileSectionOrder(user.profileSectionOrder)
      : DEFAULT_PROFILE_SECTION_ORDER);

  const isCinema = profileTheme === 'cinema';
  const sectionHeadingClass = isCinema
    ? 'mb-4 text-[11px] font-semibold uppercase tracking-widest text-amber-200/50'
    : 'mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-600';
  const pageBg = isCinema ? 'bg-zinc-950' : 'bg-black';

  const renderSidebarSocials = () =>
    socialLinks.length > 0 ? (
      <div className="flex flex-wrap gap-3.5 border-t border-zinc-900 pt-4 w-full justify-center md:justify-start">
        {socials?.linkedin && (
          <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
          </a>
        )}
        {socials?.github && (
          <a href={socials.github} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
          </a>
        )}
        {socials?.twitter && (
          <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
          </a>
        )}
        {socials?.website && (
          <a href={socials.website} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
            <Globe className="h-4 w-4" />
          </a>
        )}
        {socials?.email && (
          <a href={`mailto:${socials.email}`} className="text-zinc-500 hover:text-white transition-colors">
            <Mail className="h-4 w-4" />
          </a>
        )}
      </div>
    ) : null;

  const mainSectionOrder = sectionOrder.filter((id) => id !== 'identity');

  const renderMainSection = (id: ProfileSectionId) => {
    switch (id) {
      case 'bio':
        return user.bio ? (
          <div key="bio" className="space-y-3">
            <h3 className={sectionHeadingClass}>About Me</h3>
            <p className={`text-sm leading-relaxed font-medium italic ${isCinema ? 'text-zinc-300' : 'text-zinc-300'}`}>
              &ldquo;{user.bio}&rdquo;
            </p>
          </div>
        ) : null;
      case 'experience':
        return experiences.length > 0 ? (
          <div key="experience" className="space-y-4">
            <h3 className={sectionHeadingClass}>Experience</h3>
            <div className={`relative space-y-6 pl-6 ${isCinema ? 'border-l border-amber-500/20' : 'border-l border-zinc-900'}`}>
              {experiences.map((exp, idx) => (
                <div key={idx} className="relative space-y-1">
                  <div className={`absolute -left-[30px] top-1.5 h-2 w-2 rounded-full border border-black ${isCinema ? 'bg-amber-400' : 'bg-white'}`} />
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-white">{exp.role}</h4>
                      <p className="text-xs text-zinc-400 font-medium">{exp.company}</p>
                    </div>
                    {exp.duration && (
                      <span className="text-[10px] text-zinc-500 font-medium bg-zinc-950 px-2 py-0.5 border border-zinc-900 rounded-md mt-1 md:mt-0">
                        {exp.duration}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <div key="projects" className="space-y-4">
            <h3 className={sectionHeadingClass}>Key Projects</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {projects.map((proj, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                    isCinema
                      ? 'border-amber-500/10 bg-amber-500/[0.03] hover:border-amber-500/20'
                      : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800'
                  }`}
                >
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-white">{proj.title}</h4>
                    {proj.description && (
                      <p className="text-xs text-zinc-400 leading-relaxed">{proj.description}</p>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    {proj.website && (
                      <a href={proj.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors">
                        Live Site <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                    {proj.github && (
                      <a href={proj.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors">
                        Codebase <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'socials':
        return socialLinks.length > 0 ? (
          <div key="socials" className="space-y-4 pt-2">
            <h3 className={sectionHeadingClass}>Contact & Socials</h3>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {socials?.email && (
                <a href={`mailto:${socials.email}`} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-all flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400"><Mail className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">Email</p>
                    <p className="text-xs font-medium text-white">{socials.email}</p>
                  </div>
                </a>
              )}
              {socials?.linkedin && (
                <a href={socials.linkedin} target="_blank" rel="noopener noreferrer" className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-all flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase">LinkedIn</p>
                    <p className="text-xs font-medium text-white">Connect on LinkedIn</p>
                  </div>
                </a>
              )}
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  if (isPublicProfile) {
    return (
      <div className={`min-h-screen ${pageBg} text-white selection:bg-white selection:text-black py-10 md:py-16`}>
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <header className="mb-8 flex items-center md:mb-10">
            <SeenlyLogo
              size="md"
              showBeta={false}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 shadow-lg shadow-black/20 backdrop-blur-md transition-all hover:border-white/15 hover:bg-white/[0.07]"
            />
          </header>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
            {/* Sidebar */}
            <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-6 md:sticky md:top-24">
              <div className="relative group">
                <div className={`absolute -inset-0.5 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000 ${isCinema ? 'bg-gradient-to-r from-amber-700 to-amber-500' : 'bg-gradient-to-r from-zinc-800 to-zinc-700'}`} />
                <div className="relative h-28 w-28 rounded-full bg-zinc-900 border border-zinc-850 overflow-hidden flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold">{user.username?.slice(0, 2).toUpperCase() || '??'}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center gap-1.5 md:justify-start">
                  <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
                  {showFounderBadge && <GoldenVerifiedTick size="lg" />}
                  {!showFounderBadge && showProBadge && <ProVerifiedTick size="lg" />}
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed">{displayHeadline}</p>
                {user.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                    <MapPin className="h-3 w-3" /> {displayLocation}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 w-full justify-center md:justify-start">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-2 border border-zinc-800 hover:bg-zinc-900 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all"
                >
                  <Share2 className="h-3.5 w-3.5" /> {copied ? 'Copied Link' : 'Share Profile'}
                </button>
                {user.resumeUrl && user.resumeUrl !== '#' && (
                  <button
                    type="button"
                    onClick={handleDownloadResume}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isCinema ? 'bg-amber-400 text-black hover:bg-amber-300' : 'bg-white text-black hover:bg-zinc-200'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> Download CV
                  </button>
                )}
              </div>

              {renderSidebarSocials()}
            </div>

            {/* Main — video hero + content */}
            <div className="md:col-span-8 space-y-10">
              <div
                className={`relative overflow-hidden rounded-2xl bg-black shadow-2xl shadow-black/40 ${
                  isCinema ? 'ring-1 ring-amber-500/15' : 'ring-1 ring-white/10'
                }`}
              >
                <IntroVideo
                  videoUrl={user.videoUrl}
                  thumbnailUrl={user.thumbnailUrl}
                  preview={preview}
                  userId={user.id}
                  onPlay={handleVideoPlay}
                  maxHeightClass="max-h-[min(70dvh,560px)]"
                />
              </div>

              {mainSectionOrder.map((id) => renderMainSection(id))}
            </div>
          </div>

          <div className="mt-16 border-t border-white/10 pt-12 md:mt-20 md:pt-14">
            <ProfilePublicFooter username={user.username} />
          </div>
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
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
            <IntroVideo
              videoUrl={user.videoUrl}
              thumbnailUrl={user.thumbnailUrl}
              preview={preview}
              userId={user.id}
              onPlay={handleVideoPlay}
              maxHeightClass={embedded ? 'max-h-[50vh]' : 'max-h-[60vh]'}
            />
          </div>

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
