'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Share2, MapPin, ExternalLink,
  Mail, Globe, Play, Pause, Volume2, VolumeX,
} from 'lucide-react';
import { isPersistedMediaUrl } from '@/lib/storage';
import { logAnalyticEvent } from '@/db/actions';
import GoldenVerifiedTick from '@/components/profile/GoldenVerifiedTick';
import ProVerifiedTick from '@/components/profile/ProVerifiedTick';
import SeenlyLogo from '@/components/SeenlyLogo';
import {
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
        className={`flex min-h-[12rem] w-full items-center justify-center px-6 text-center text-sm text-zinc-500 ${shellClass}`}
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

function SocialIconLink({
  href,
  label,
  className = '',
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith('mailto:') ? undefined : '_blank'}
      rel={href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors hover:bg-profile-accent hover:text-black hover:border-profile-accent ${className}`}
    >
      {children}
    </a>
  );
}

function ProfilePublicFooter({ username }: { username?: string }) {
  const handle = username || 'yourusername';

  return (
    <footer className="flex justify-center pb-2 pt-4">
      <Link
        href="/onboarding"
        className="group inline-flex w-full max-w-md flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-center transition-all hover:border-profile-accent/30 hover:bg-white/[0.06]"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">Seenly</p>
        <p className="text-sm font-medium leading-snug text-white/80 group-hover:text-white">
          Claim yours — make your profile
        </p>
        <p className="font-mono text-xs text-white/45 group-hover:text-white/65">
          seenly.tech/{handle}
        </p>
      </Link>
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
  profileSectionOrder: _profileSectionOrderProp,
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
  const firstName = displayName.trim().split(/\s+/)[0] || displayName;
  const displayHeadline = user.headline || 'Your professional headline';
  const displayLocation = user.location || 'Location';
  const displayBio = user.bio || displayHeadline;

  const profileTheme =
    profileThemeProp ??
    (showFounderBadge ? parseProfileTheme(user.profileTheme) : 'minimal');

  const isCinema = profileTheme === 'cinema';
  const accentClass = isCinema ? 'bg-amber-400 text-black' : 'bg-profile-accent text-black';
  const accentText = isCinema ? 'text-amber-300' : 'text-profile-accent';
  const socialIconClass = isCinema
    ? 'border-amber-400/80 text-amber-300 hover:bg-amber-400 hover:text-black hover:border-amber-400'
    : 'border-profile-accent/80 text-profile-accent';
  const cardBg = 'bg-[#161616]';

  const featuredProject = projects[0];

  const renderSocialIcons = () => (
    <div className="flex flex-wrap items-center gap-2.5">
      {socials?.twitter && (
        <SocialIconLink href={socials.twitter} label="Twitter" className={socialIconClass}>
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.792l7.719-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
        </SocialIconLink>
      )}
      {socials?.email && (
        <SocialIconLink href={`mailto:${socials.email}`} label="Email" className={socialIconClass}>
          <Mail className="h-4 w-4" />
        </SocialIconLink>
      )}
      {socials?.linkedin && (
        <SocialIconLink href={socials.linkedin} label="LinkedIn" className={socialIconClass}>
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
        </SocialIconLink>
      )}
      {socials?.github && (
        <SocialIconLink href={socials.github} label="GitHub" className={socialIconClass}>
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
        </SocialIconLink>
      )}
      {(socials?.website || socials?.portfolio) && (
        <SocialIconLink href={(socials.website || socials.portfolio)!} label="Website" className={socialIconClass}>
          <Globe className="h-4 w-4" />
        </SocialIconLink>
      )}
    </div>
  );

  /** Bento public profile — video first, same data as before */
  if (isPublicProfile) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-black font-geist text-white selection:bg-profile-accent selection:text-black">
        {/* Atmosphere */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(200,245,66,0.12),transparent_65%)] blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(180,120,40,0.14),transparent_70%)] blur-2xl"
        />

        <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 md:py-12">
          <div className="mb-8 flex items-center justify-between gap-4 sm:mb-10">
            <SeenlyLogo
              size="md"
              showBeta={false}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 backdrop-blur-md"
            />
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              <Share2 className="h-3.5 w-3.5" />
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>

          {/* Name header with hairlines */}
          <div className="mb-8 flex items-center gap-4 sm:mb-10 sm:gap-6">
            <div className="h-px flex-1 bg-white/20" />
            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 text-center">
              <h1
                className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl"
                style={{ fontFamily: 'var(--font-instrument-serif), ui-serif, Georgia, serif' }}
              >
                {displayName}
              </h1>
              {showFounderBadge && <GoldenVerifiedTick size="lg" />}
              {!showFounderBadge && showProBadge && <ProVerifiedTick size="lg" />}
            </div>
            <div className="h-px flex-1 bg-white/20" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
            {/* Mobile: video first */}
            <div className="order-1 lg:order-2 lg:col-span-7 xl:col-span-8">
              <div className={`${cardBg} overflow-hidden rounded-[1.5rem] p-3 sm:p-4`}>
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <h2 className="text-sm font-semibold text-white sm:text-base">Intro video</h2>
                  {featuredProject?.website && (
                    <a
                      href={featuredProject.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs font-medium ${accentText} hover:underline`}
                    >
                      View project <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="overflow-hidden rounded-[1.15rem] bg-black">
                  <IntroVideo
                    videoUrl={user.videoUrl}
                    thumbnailUrl={user.thumbnailUrl}
                    preview={preview}
                    userId={user.id}
                    onPlay={handleVideoPlay}
                    maxHeightClass="max-h-[min(68dvh,520px)]"
                  />
                </div>

                {projects.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {projects.slice(0, 4).map((proj, idx) => (
                      <div
                        key={idx}
                        className={`rounded-2xl p-3.5 sm:p-4 ${
                          idx % 2 === 1
                            ? isCinema
                              ? 'bg-amber-400 text-black'
                              : 'bg-profile-accent text-black'
                            : 'bg-white text-black'
                        }`}
                      >
                        <p className="text-sm font-semibold leading-snug">{proj.title}</p>
                        {proj.description && (
                          <p className="mt-1.5 line-clamp-2 text-xs opacity-70">{proj.description}</p>
                        )}
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {proj.website && (
                            <a
                              href={proj.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold underline-offset-2 hover:underline"
                            >
                              Live <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                          {proj.github && (
                            <a
                              href={proj.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold underline-offset-2 hover:underline"
                            >
                              Code <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom action bar */}
              <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] ${cardBg} px-4 py-3.5 sm:px-5`}>
                {renderSocialIcons()}
                <div className="flex flex-wrap items-center gap-2">
                  {user.resumeUrl && user.resumeUrl !== '#' && (
                    <button
                      type="button"
                      onClick={handleDownloadResume}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                    >
                      Resume <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Left column */}
            <div className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-5 xl:col-span-4">
              <div className={`${cardBg} overflow-hidden rounded-[1.5rem]`}>
                <div className="relative aspect-[4/5] max-h-[320px] w-full overflow-hidden bg-zinc-900 sm:max-h-[380px]">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl font-bold text-white/30">
                      {user.username?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                  )}
                </div>
                <div className={`m-3 rounded-[1.15rem] px-4 py-4 sm:m-3.5 ${accentClass}`}>
                  <p className="text-base font-bold tracking-tight sm:text-lg">
                    Hello, I&apos;m {firstName}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed opacity-80">
                    &ldquo;{displayBio}&rdquo;
                  </p>
                </div>
              </div>

              <div className={`${cardBg} space-y-5 rounded-[1.5rem] px-5 py-5`}>
                {user.location && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-white/35">Location</p>
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-white/80">
                      <MapPin className="h-3.5 w-3.5 text-white/40" />
                      {displayLocation}
                    </p>
                  </div>
                )}

                {experiences.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-white">Experience</p>
                    <ul className="mt-3 space-y-3">
                      {experiences.map((exp, idx) => (
                        <li key={idx} className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white/90">{exp.company}</p>
                            <p className="text-xs text-white/45">{exp.role}</p>
                          </div>
                          {exp.duration && (
                            <span className="shrink-0 text-right text-[11px] text-white/40">
                              {exp.duration}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {projects.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-white">Focus</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">
                      {projects
                        .slice(0, 4)
                        .map((p) => p.title)
                        .join(' · ')}
                    </p>
                  </div>
                )}

                {user.headline && (
                  <div>
                    <p className="text-sm font-semibold text-white">About</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/50">{displayHeadline}</p>
                  </div>
                )}

                {!experiences.length && !projects.length && !user.headline && (
                  <p className="text-sm text-white/40">Profile details coming soon.</p>
                )}
              </div>
            </div>
          </div>

          {!removeBranding && (
            <div className="mt-12 border-t border-white/10 pt-10 md:mt-16">
              <ProfilePublicFooter username={user.username} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Embedded / dashboard preview — same bento language, compact
  const gridClass = isDesktopLayout
    ? 'grid grid-cols-12 gap-4 items-start'
    : isMobileLayout
      ? 'grid grid-cols-1 gap-4 items-start'
      : 'grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 items-start';

  const sidebarClass = isDesktopLayout
    ? 'col-span-4 flex flex-col gap-3'
    : isMobileLayout
      ? 'col-span-1 flex flex-col gap-3 order-2'
      : 'md:col-span-4 flex flex-col gap-3 order-2 md:order-1';

  const mainClass = isDesktopLayout
    ? 'col-span-8 space-y-3'
    : isMobileLayout
      ? 'col-span-1 space-y-3 order-1'
      : 'md:col-span-8 space-y-3 order-1 md:order-2';

  return (
    <div
      className={
        embedded
          ? 'bg-black font-geist text-white selection:bg-profile-accent selection:text-black'
          : 'min-h-screen bg-black font-geist text-white selection:bg-profile-accent selection:text-black py-10 md:py-16'
      }
    >
      <div
        className={`mx-auto px-3 sm:px-4 ${gridClass} ${
          embedded ? 'max-w-none py-4' : 'max-w-5xl'
        }`}
      >
        <div className={sidebarClass}>
          <div className={`${cardBg} overflow-hidden rounded-2xl`}>
            <div className="aspect-[4/5] max-h-48 overflow-hidden bg-zinc-900">
              {user.avatar ? (
                <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-2xl font-bold text-white/30">
                  {user.username?.slice(0, 2).toUpperCase() || '??'}
                </span>
              )}
            </div>
            <div className={`m-2.5 rounded-xl px-3 py-3 ${accentClass}`}>
              <p className="text-sm font-bold">Hello, I&apos;m {firstName}</p>
              <p className="mt-1 line-clamp-3 text-xs opacity-80">&ldquo;{displayBio}&rdquo;</p>
            </div>
          </div>

          <div className={`${cardBg} space-y-3 rounded-2xl px-4 py-4`}>
            <div className="flex flex-wrap items-center gap-1.5">
              <h1
                className="text-lg font-semibold tracking-tight"
                style={{ fontFamily: 'var(--font-instrument-serif), ui-serif, Georgia, serif' }}
              >
                {displayName}
              </h1>
              {showFounderBadge && <GoldenVerifiedTick size="md" />}
              {!showFounderBadge && showProBadge && <ProVerifiedTick size="md" />}
            </div>
            <p className="text-xs text-white/50">{displayHeadline}</p>
            {(user.location || preview) && (
              <span className="inline-flex items-center gap-1 text-[11px] text-white/40">
                <MapPin className="h-3 w-3" /> {displayLocation}
              </span>
            )}
          </div>
        </div>

        <div className={mainClass}>
          <div className={`${cardBg} overflow-hidden rounded-2xl p-3`}>
            <p className="mb-2 px-1 text-xs font-semibold text-white/80">Intro video</p>
            <div className="overflow-hidden rounded-xl ring-1 ring-white/5">
              <IntroVideo
                videoUrl={user.videoUrl}
                thumbnailUrl={user.thumbnailUrl}
                preview={preview}
                userId={user.id}
                onPlay={handleVideoPlay}
                maxHeightClass={embedded ? 'max-h-[42vh]' : 'max-h-[50vh]'}
              />
            </div>
          </div>

          {experiences.length > 0 && (
            <div className={`${cardBg} space-y-2 rounded-2xl px-4 py-3`}>
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Experience</h3>
              <ul className="space-y-2">
                {experiences.map((exp, idx) => (
                  <li key={idx}>
                    <p className="text-sm font-medium">{exp.role}</p>
                    <p className="text-xs text-white/40">
                      {exp.company}
                      {exp.duration ? ` · ${exp.duration}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {projects.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {projects.slice(0, 4).map((proj, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl p-3 ${
                    idx % 2 === 1 ? accentClass : 'bg-white text-black'
                  }`}
                >
                  <p className="text-sm font-semibold">{proj.title}</p>
                  {proj.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] opacity-70">{proj.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!embedded && !removeBranding && (
        <footer className="px-6 pb-10 pt-8">
          <div className="mx-auto flex max-w-5xl justify-center">
            <Link href="/onboarding" className="text-xs text-zinc-600 hover:text-zinc-400">
              Built with <span className="text-zinc-400">seenly.tech</span>
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}
