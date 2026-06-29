'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Share2, MapPin, ExternalLink,
  Mail, Phone, Globe,
} from 'lucide-react';
import { isPersistedMediaUrl } from '@/lib/storage';
import { logAnalyticEvent } from '@/db/actions';

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
}

export default function ProfileView({
  profileData,
  preview = false,
  layout,
  embedded = false,
}: ProfileViewProps) {
  const { user, experiences, projects, socials } = profileData;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasLoggedPlay, setHasLoggedPlay] = useState(false);
  const [copied, setCopied] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

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
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTo = (platform: 'linkedin' | 'twitter' | 'whatsapp' | 'email') => {
    if (preview) return;
    const encodedUrl = encodeURIComponent(profileUrl);
    const encodedText = encodeURIComponent(shareText);
    const urls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      email: `mailto:?subject=${encodedText}&body=${encodedUrl}`,
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  const canPlayVideo =
    !!user.videoUrl && (preview || isPersistedMediaUrl(user.videoUrl));

  const displayName = user.fullName || user.username || 'Your Name';
  const displayHeadline = user.headline || 'Your professional headline';
  const displayLocation = user.location || 'Location';

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

  const actionRowClass = isMobileLayout
    ? 'flex flex-wrap gap-2 w-full justify-center'
    : 'flex flex-wrap gap-2 w-full justify-center md:justify-start';

  const socialRowClass = isMobileLayout
    ? 'flex flex-wrap gap-3.5 pt-4 border-t border-zinc-900 w-full justify-center'
    : 'flex flex-wrap gap-3.5 pt-4 border-t border-zinc-900 w-full justify-center md:justify-start';

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
        {/* Profile sidebar */}
        <div className={sidebarClass}>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-1000" />
            <div className="relative h-28 w-28 rounded-full bg-zinc-900 border border-zinc-850 overflow-hidden flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-extrabold">
                  {user.username?.slice(0, 2).toUpperCase() || '??'}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">{displayHeadline}</p>
            {(user.location || preview) && (
              <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="h-3 w-3" /> {displayLocation}
              </span>
            )}
          </div>

          <div className={actionRowClass}>
            <button
              type="button"
              onClick={handleShare}
              className={`flex items-center gap-2 border border-zinc-800 hover:bg-zinc-900 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                preview ? 'cursor-default opacity-80' : ''
              }`}
            >
              <Share2 className="h-3.5 w-3.5" /> {copied ? 'Copied Link' : 'Share Profile'}
            </button>
            {user.resumeUrl && user.resumeUrl !== '#' && (
              <button
                type="button"
                onClick={handleDownloadResume}
                className={`flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  preview ? 'cursor-default opacity-80' : ''
                }`}
              >
                <FileText className="h-3.5 w-3.5" /> Download CV
              </button>
            )}
          </div>

          <div className={actionRowClass}>
            {(['linkedin', 'twitter', 'whatsapp', 'email'] as const).map((platform) => (
              <button
                key={platform}
                type="button"
                onClick={() => shareTo(platform)}
                className={`rounded-lg border border-zinc-900 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:border-zinc-700 hover:text-white ${
                  preview ? 'cursor-default' : ''
                }`}
              >
                {platform}
              </button>
            ))}
          </div>

          {socials && (
            <div className={socialRowClass}>
              {socials.linkedin && (
                <a
                  href={preview ? undefined : socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-zinc-500 hover:text-white transition-colors ${preview ? 'pointer-events-none' : ''}`}
                  tabIndex={preview ? -1 : undefined}
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              )}
              {socials.github && (
                <a
                  href={preview ? undefined : socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-zinc-500 hover:text-white transition-colors ${preview ? 'pointer-events-none' : ''}`}
                  tabIndex={preview ? -1 : undefined}
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              )}
              {socials.twitter && (
                <a
                  href={preview ? undefined : socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-zinc-500 hover:text-white transition-colors ${preview ? 'pointer-events-none' : ''}`}
                  tabIndex={preview ? -1 : undefined}
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
              )}
              {socials.website && (
                <a
                  href={preview ? undefined : socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-zinc-500 hover:text-white transition-colors ${preview ? 'pointer-events-none' : ''}`}
                  tabIndex={preview ? -1 : undefined}
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {socials.email && (
                <a
                  href={preview ? undefined : `mailto:${socials.email}`}
                  className={`text-zinc-500 hover:text-white transition-colors ${preview ? 'pointer-events-none' : ''}`}
                  tabIndex={preview ? -1 : undefined}
                >
                  <Mail className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className={mainClass}>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
            <div className="aspect-video w-full relative bg-black">
              {canPlayVideo ? (
                <>
                  {user.thumbnailUrl && !videoReady && (
                    <img
                      src={user.thumbnailUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      fetchPriority="high"
                    />
                  )}
                  <video
                    ref={videoRef}
                    src={user.videoUrl}
                    poster={user.thumbnailUrl || undefined}
                    className="relative h-full w-full object-cover"
                    controls
                    playsInline
                    preload="auto"
                    onLoadedData={() => setVideoReady(true)}
                    onPlay={() => {
                      if (preview || !user.id || hasLoggedPlay) return;
                      logAnalyticEvent(user.id, 'plays');
                      setHasLoggedPlay(true);
                    }}
                  />
                </>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
                  No intro video uploaded yet.
                </div>
              )}
            </div>
          </div>

          {(user.bio || preview) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">About Me</h3>
              <p className="text-zinc-300 leading-relaxed text-sm font-medium italic">
                &ldquo;{user.bio || 'Write a brief description about your expertise and drive.'}&rdquo;
              </p>
            </div>
          )}

          {experiences.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Experience</h3>
              <div className="relative border-l border-zinc-900 pl-6 space-y-6">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute -left-[30px] top-1.5 h-2 w-2 rounded-full bg-white border border-black" />
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
          )}

          {projects.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Key Projects</h3>
              <div className={`grid gap-4 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm text-white">{proj.title}</h4>
                      {proj.description && (
                        <p className="text-xs text-zinc-400 leading-relaxed">{proj.description}</p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      {proj.website && (
                        <a
                          href={preview ? undefined : proj.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors ${
                            preview ? 'pointer-events-none' : ''
                          }`}
                          tabIndex={preview ? -1 : undefined}
                        >
                          Live Site <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {proj.github && (
                        <a
                          href={preview ? undefined : proj.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 hover:text-white transition-colors ${
                            preview ? 'pointer-events-none' : ''
                          }`}
                          tabIndex={preview ? -1 : undefined}
                        >
                          Codebase <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {socials && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Contact & Socials</h3>
              <div className={`grid gap-4 ${isMobileLayout ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {socials.email && (
                  <a
                    href={preview ? undefined : `mailto:${socials.email}`}
                    className={`p-4 rounded-xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-all flex items-center gap-3 ${
                      preview ? 'pointer-events-none' : ''
                    }`}
                    tabIndex={preview ? -1 : undefined}
                  >
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase">Email</p>
                      <p className="text-xs font-medium text-white">{socials.email}</p>
                    </div>
                  </a>
                )}
                {socials.phone && (
                  <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase">Phone</p>
                      <p className="text-xs font-medium text-white">{socials.phone}</p>
                    </div>
                  </div>
                )}
                {socials.linkedin && (
                  <a
                    href={preview ? undefined : socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 rounded-xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-all flex items-center gap-3 ${
                      preview ? 'pointer-events-none' : ''
                    }`}
                    tabIndex={preview ? -1 : undefined}
                  >
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase">LinkedIn</p>
                      <p className="text-xs font-medium text-white">Connect on LinkedIn</p>
                    </div>
                  </a>
                )}
                {socials.github && (
                  <a
                    href={preview ? undefined : socials.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 rounded-xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-all flex items-center gap-3 ${
                      preview ? 'pointer-events-none' : ''
                    }`}
                    tabIndex={preview ? -1 : undefined}
                  >
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase">GitHub</p>
                      <p className="text-xs font-medium text-white">View Projects</p>
                    </div>
                  </a>
                )}
                {socials.portfolio && (
                  <a
                    href={preview ? undefined : socials.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-4 rounded-xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-all flex items-center gap-3 ${
                      preview ? 'pointer-events-none' : ''
                    }`}
                    tabIndex={preview ? -1 : undefined}
                  >
                    <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase">Portfolio</p>
                      <p className="text-xs font-medium text-white">Visit Website</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {!embedded && (
        <footer className="px-6 pb-12 pt-10">
          <div className="mx-auto max-w-4xl flex justify-center">
            <Link
              href="/onboarding"
              className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/50 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/8 hover:text-white/70"
            >
              <span>Built with</span>
              <span className="font-semibold text-white/80">seenly.tech</span>
              <span className="hidden text-white/25 sm:inline">·</span>
              <span>
                make yours with{' '}
                <span className="font-semibold text-white/80">your username</span>
              </span>
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}
