'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Share2, ExternalLink, Mail, Globe,
  Play, Pause, Volume2, VolumeX, Moon, Sun,
} from 'lucide-react';
import { isPersistedMediaUrl } from '@/lib/storage';
import { logAnalyticEvent } from '@/db/actions';
import GoldenVerifiedTick from '@/components/profile/GoldenVerifiedTick';
import ProVerifiedTick from '@/components/profile/ProVerifiedTick';
import SeenlyLogo from '@/components/SeenlyLogo';
import {
  isDarkProfileTheme,
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
  fill = false,
}: {
  videoUrl?: string;
  thumbnailUrl?: string;
  preview: boolean;
  userId?: string;
  onPlay?: () => void;
  className?: string;
  /** Cover-fill hero (object-cover) vs intrinsic height */
  fill?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const canPlay = !!videoUrl && (preview || isPersistedMediaUrl(videoUrl));
  const shellClass = `group relative w-full overflow-hidden bg-zinc-900 ${fill ? 'h-full min-h-[240px]' : ''} ${className}`;
  const mediaClass = fill
    ? 'absolute inset-0 h-full w-full object-cover'
    : 'block h-auto w-full max-h-[70dvh]';

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted((prev) => !prev);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
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
        <img src={thumbnailUrl} alt="" className={mediaClass} />
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
      <div className={`flex items-center justify-center px-6 text-center text-sm text-zinc-500 ${shellClass}`}>
        No intro video yet.
      </div>
    );
  }

  return (
    <div className={shellClass}>
      {thumbnailUrl && !videoReady && (
        <img src={thumbnailUrl} alt="" className={mediaClass} fetchPriority="high" />
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        className={
          videoReady
            ? mediaClass
            : fill
              ? `${mediaClass} opacity-0`
              : `absolute inset-0 h-full w-full object-contain opacity-0`
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
              className="absolute inset-0 z-[1] flex items-center justify-center bg-black/20 transition-opacity group-hover:bg-black/30"
              aria-label="Play video"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform hover:scale-105">
                <Play className="ml-1 h-6 w-6 fill-black text-black" />
              </span>
            </button>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-3 pt-12 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <div className="pointer-events-auto flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm hover:bg-white/25"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
              <div
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                className="relative h-1 flex-1 cursor-pointer rounded-full bg-white/25"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSeek(e);
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white"
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

function ProfilePublicFooter({
  username,
  dark,
}: {
  username?: string;
  dark: boolean;
}) {
  const handle = username || 'yourusername';

  return (
    <footer className="flex justify-center pt-2">
      <Link
        href="/onboarding"
        className={`group inline-flex w-full max-w-sm flex-col items-center gap-1 rounded-2xl border px-5 py-3.5 text-center transition-all ${
          dark
            ? 'border-white/10 bg-white/[0.04] hover:border-white/20'
            : 'border-black/8 bg-white/60 hover:border-black/15 shadow-sm'
        }`}
      >
        <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? 'text-white/35' : 'text-zinc-400'}`}>
          Seenly
        </p>
        <p className={`text-sm font-medium ${dark ? 'text-white/80 group-hover:text-white' : 'text-zinc-700 group-hover:text-zinc-900'}`}>
          Claim yours — make your profile
        </p>
        <p className={`font-mono text-xs ${dark ? 'text-white/40' : 'text-zinc-400'}`}>
          seenly.tech/{handle}
        </p>
      </Link>
    </footer>
  );
}

type Surface = {
  page: string;
  card: string;
  text: string;
  muted: string;
  faint: string;
  divider: string;
  cta: string;
  pill: string;
  glass: string;
  logoWrap: string;
  fadeFrom: string;
  avatarRing: string;
  selection: string;
};

function getSurface(dark: boolean): Surface {
  if (dark) {
    return {
      page: 'bg-[#0a0a0a] text-white',
      card: 'bg-[#141414] border border-white/[0.08] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)]',
      text: 'text-white',
      muted: 'text-zinc-400',
      faint: 'text-zinc-500',
      divider: 'bg-white/10',
      cta: 'bg-white text-black hover:bg-zinc-200',
      pill: 'bg-white/10 text-white/80 border border-white/10',
      glass: 'bg-black/35 text-white border-white/15 hover:bg-black/50',
      logoWrap: 'border-white/10 bg-white/[0.06] text-white',
      fadeFrom: 'from-[#141414]',
      avatarRing: 'ring-[#141414]',
      selection: 'selection:bg-white selection:text-black',
    };
  }
  return {
    page: 'bg-[#f3f1ec] text-zinc-900',
    card: 'bg-white border border-black/[0.04] shadow-[0_28px_80px_-28px_rgba(0,0,0,0.35)]',
    text: 'text-zinc-900',
    muted: 'text-zinc-500',
    faint: 'text-zinc-400',
    divider: 'bg-zinc-200',
    cta: 'bg-zinc-950 text-white hover:bg-zinc-800',
    pill: 'bg-zinc-100 text-zinc-600 border border-zinc-200/80',
    glass: 'bg-white/70 text-zinc-800 border-white/60 hover:bg-white/90 backdrop-blur-md',
    logoWrap: 'border-black/8 bg-white/80 text-zinc-800 shadow-sm',
    fadeFrom: 'from-white',
    avatarRing: 'ring-white',
    selection: 'selection:bg-zinc-900 selection:text-white',
  };
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
  profileSectionOrder: _profileSectionOrderProp,
}: ProfileViewProps) {
  const { user, experiences, projects, socials } = profileData;
  const [hasLoggedPlay, setHasLoggedPlay] = useState(false);
  const [copied, setCopied] = useState(false);

  const storedTheme =
    profileThemeProp ??
    (showFounderBadge ? parseProfileTheme(user.profileTheme) : null);

  const [dark, setDark] = useState(() =>
    storedTheme ? isDarkProfileTheme(storedTheme) : true
  );

  useEffect(() => {
    if (storedTheme) {
      setDark(isDarkProfileTheme(storedTheme));
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [storedTheme]);

  const isPublicProfile = !embedded && !preview;
  const isDesktopLayout = layout === 'desktop';
  const isMobileLayout = layout === 'mobile';
  const s = getSurface(dark);

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
  const displayLocation = user.location || '';

  const contactHref =
    (socials?.email && `mailto:${socials.email}`) ||
    socials?.linkedin ||
    socials?.portfolio ||
    socials?.website ||
    (user.resumeUrl && user.resumeUrl !== '#' ? user.resumeUrl : null);

  const contactLabel = socials?.email
    ? 'Get in touch'
    : socials?.linkedin
      ? 'Connect'
      : user.resumeUrl && user.resumeUrl !== '#'
        ? 'View resume'
        : 'Get in touch';

  const stats: Array<{ value: string; label: string }> = [];
  if (projects.length > 0) {
    stats.push({ value: String(projects.length), label: projects.length === 1 ? 'project' : 'projects' });
  }
  if (experiences.length > 0) {
    stats.push({ value: String(experiences.length), label: experiences.length === 1 ? 'role' : 'roles' });
  }
  if (displayLocation) {
    stats.push({ value: displayLocation.split(',')[0].trim(), label: 'location' });
  }
  if (stats.length === 0 && user.bio) {
    stats.push({ value: 'Open', label: 'to work' });
  }

  const projectTags = projects.slice(0, 3).map((p) => p.title);

  const profileCard = (
    <article className={`relative w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] ${s.card}`}>
      {/* Video hero */}
      <div className="relative h-[min(52vw,340px)] sm:h-[min(48vw,420px)] md:h-[440px]">
        <IntroVideo
          videoUrl={user.videoUrl}
          thumbnailUrl={user.thumbnailUrl}
          preview={preview}
          userId={user.id}
          onPlay={handleVideoPlay}
          fill
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-28 bg-gradient-to-t ${s.fadeFrom} to-transparent`}
        />
        <button
          type="button"
          onClick={handleShare}
          className={`absolute right-4 top-4 z-[4] flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-colors sm:right-5 sm:top-5 ${s.glass}`}
          aria-label={copied ? 'Link copied' : 'Share profile'}
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="relative px-5 pb-5 pt-0 sm:px-7 sm:pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div className="flex min-w-0 items-end gap-3.5 sm:gap-4">
            <div
              className={`relative -mt-12 h-16 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-800 ring-[3px] sm:-mt-14 sm:h-[4.5rem] sm:w-[4.5rem] ${s.avatarRing}`}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-lg font-bold text-white/50">
                  {user.username?.slice(0, 2).toUpperCase() || '??'}
                </span>
              )}
            </div>
            <div className="min-w-0 pb-0.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <h1 className={`truncate text-xl font-semibold tracking-tight sm:text-2xl ${s.text}`}>
                  {displayName}
                </h1>
                {showFounderBadge && <GoldenVerifiedTick size="md" />}
                {!showFounderBadge && showProBadge && <ProVerifiedTick size="md" />}
              </div>
              <p className={`mt-0.5 truncate text-sm ${s.muted}`}>{displayHeadline}</p>
            </div>
          </div>

          {projectTags.length > 0 && (
            <div className={`inline-flex max-w-full shrink-0 items-center gap-2 self-start rounded-full px-3 py-1.5 sm:self-end ${s.pill}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${s.faint}`}>
                Work
              </span>
              <span className={`h-3 w-px ${s.divider}`} />
              <span className={`truncate text-xs font-medium ${s.muted}`}>
                {projectTags.join(' · ')}
              </span>
            </div>
          )}
        </div>

        {user.bio && (
          <p className={`mt-4 text-sm leading-relaxed ${s.muted}`}>{user.bio}</p>
        )}

        {/* Stats + CTA */}
        <div className="mt-5 flex flex-col gap-4 border-t border-transparent pt-1 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {stats.length > 0 && (
            <div className="flex flex-wrap items-stretch gap-0">
              {stats.map((stat, idx) => (
                <React.Fragment key={stat.label}>
                  {idx > 0 && <div className={`mx-4 w-px self-stretch sm:mx-5 ${s.divider}`} />}
                  <div className="min-w-0 py-1">
                    <p className={`text-base font-semibold tracking-tight sm:text-lg ${s.text}`}>
                      {stat.value}
                    </p>
                    <p className={`text-[11px] capitalize ${s.faint}`}>{stat.label}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            {socials?.linkedin && (
              <a
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${dark ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}`}
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              </a>
            )}
            {socials?.github && (
              <a
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${dark ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}`}
                aria-label="GitHub"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              </a>
            )}
            {(socials?.website || socials?.portfolio) && (
              <a
                href={(socials.website || socials.portfolio)!}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${dark ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}`}
                aria-label="Website"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
            {socials?.email && (
              <a
                href={`mailto:${socials.email}`}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${dark ? 'border-white/10 text-white/60 hover:bg-white/5 hover:text-white' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'}`}
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
            {user.resumeUrl && user.resumeUrl !== '#' && (
              <button
                type="button"
                onClick={handleDownloadResume}
                className={`hidden h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-colors sm:inline-flex ${dark ? 'border-white/10 text-white/70 hover:bg-white/5' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
              >
                Resume <ExternalLink className="h-3 w-3" />
              </button>
            )}
            {contactHref ? (
              <a
                href={contactHref}
                target={contactHref.startsWith('mailto:') ? undefined : '_blank'}
                rel={contactHref.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${s.cta}`}
              >
                {contactLabel}
              </a>
            ) : null}
          </div>
        </div>

        {/* Experience / projects detail */}
        {(experiences.length > 0 || projects.length > 1) && (
          <div className={`mt-6 grid gap-5 border-t pt-5 sm:grid-cols-2 ${dark ? 'border-white/[0.08]' : 'border-zinc-100'}`}>
            {experiences.length > 0 && (
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${s.faint}`}>Experience</p>
                <ul className="mt-3 space-y-3">
                  {experiences.slice(0, 4).map((exp, idx) => (
                    <li key={idx}>
                      <p className={`text-sm font-medium ${s.text}`}>{exp.role}</p>
                      <p className={`text-xs ${s.muted}`}>
                        {exp.company}
                        {exp.duration ? ` · ${exp.duration}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {projects.length > 0 && (
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${s.faint}`}>Projects</p>
                <ul className="mt-3 space-y-3">
                  {projects.slice(0, 4).map((proj, idx) => (
                    <li key={idx}>
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${s.text}`}>{proj.title}</p>
                        {proj.website && (
                          <a
                            href={proj.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`shrink-0 ${s.faint} hover:opacity-80`}
                            aria-label={`Open ${proj.title}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      {proj.description && (
                        <p className={`mt-0.5 line-clamp-2 text-xs ${s.muted}`}>{proj.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );

  if (isPublicProfile) {
    return (
      <div className={`min-h-screen font-geist transition-colors ${s.page} ${s.selection}`}>
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 md:py-14">
          <div className="mb-6 flex items-center justify-between gap-3 sm:mb-8">
            <SeenlyLogo
              size="md"
              showBeta={false}
              className={`rounded-full border px-4 py-2.5 backdrop-blur-md ${s.logoWrap}`}
            />
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${dark ? 'border-white/10 bg-white/[0.04] text-white/70 hover:text-white' : 'border-black/8 bg-white/70 text-zinc-600 hover:text-zinc-900 shadow-sm'}`}
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>

          {profileCard}

          {!removeBranding && (
            <div className="mt-10">
              <ProfilePublicFooter username={user.username} dark={dark} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Preview / embed
  const wrapClass = embedded
    ? `font-geist ${s.page} ${s.selection}`
    : `min-h-screen font-geist py-8 md:py-12 ${s.page} ${s.selection}`;

  return (
    <div className={wrapClass}>
      <div className={`mx-auto px-3 sm:px-4 ${embedded ? 'max-w-none py-2' : 'max-w-3xl'}`}>
        {!embedded && (
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={() => setDark((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium ${dark ? 'border-white/10 text-white/60' : 'border-zinc-200 text-zinc-500'}`}
            >
              {dark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
              {dark ? 'Light' : 'Dark'}
            </button>
          </div>
        )}
        <div className={isMobileLayout ? 'max-w-md mx-auto' : isDesktopLayout ? '' : ''}>
          {profileCard}
        </div>
        {!embedded && !removeBranding && (
          <div className="mt-8 flex justify-center">
            <Link href="/onboarding" className={`text-xs ${s.faint} hover:opacity-80`}>
              Built with seenly.tech
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
