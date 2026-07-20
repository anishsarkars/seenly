'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { listPublicProfiles, type PublicProfileCard } from '@/db/actions';

type CardProfile = {
  id: string;
  name: string;
  headline: string;
  username: string;
  avatar: string;
  poster: string;
  video: string | null;
  location: string | null;
};

function toCard(p: PublicProfileCard): CardProfile {
  const poster = p.thumbnailUrl || p.avatar || '/avatars/minimal-1.svg';
  return {
    id: p.id,
    name: p.fullName || p.username,
    headline: p.headline || 'Seenly profile',
    username: p.username,
    avatar: p.avatar || '/avatars/minimal-1.svg',
    poster,
    video: p.videoUrl,
    location: p.location,
  };
}

function ProfileCard({
  profile,
  active,
  onActivate,
}: {
  profile: CardProfile;
  active: boolean;
  onActivate: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && playing && profile.video) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [active, playing, profile.video]);

  return (
    <article
      className={`relative w-[min(78vw,280px)] shrink-0 snap-center overflow-hidden rounded-[1.75rem] bg-zinc-900 transition-all duration-500 sm:w-[300px] ${
        active ? 'scale-100 opacity-100 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)]' : 'scale-[0.92] opacity-55'
      }`}
      onClick={onActivate}
    >
      <div className="relative aspect-[3/4] w-full">
        <img
          src={profile.poster}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
            playing && active && profile.video ? 'opacity-0' : 'opacity-100'
          }`}
          loading="lazy"
        />
        {profile.video && (
          <video
            ref={videoRef}
            src={profile.video}
            poster={profile.poster}
            muted
            playsInline
            loop
            preload="none"
            className={`absolute inset-0 h-full w-full object-cover ${
              playing && active ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {profile.video && !playing && (
          <button
            type="button"
            className="absolute inset-0 z-[1] flex items-center justify-center"
            aria-label={`Play ${profile.name}'s intro`}
            onClick={(e) => {
              e.stopPropagation();
              onActivate();
              setPlaying(true);
            }}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl transition-transform hover:scale-105">
              <Play className="ml-0.5 h-6 w-6 fill-black text-black" />
            </span>
          </button>
        )}

        <div className="absolute inset-x-3 bottom-3 z-[2] rounded-2xl border border-white/15 bg-zinc-950/80 p-3.5 text-left shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{profile.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] uppercase tracking-wide text-zinc-400">
                {profile.headline}
              </p>
            </div>
            <Link
              href={`/${profile.username}`}
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black"
              aria-label={`View ${profile.name}'s profile`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white">
              @{profile.username}
            </span>
            {profile.location && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
                {profile.location}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FeaturedProfilesCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [profiles, setProfiles] = useState<CardProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listPublicProfiles({ limit: 12, preferVideo: true })
      .then(({ profiles: rows }) => {
        if (cancelled) return;
        setProfiles(rows.map(toCard));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loop = profiles.length > 1 ? [...profiles, ...profiles] : profiles;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || profiles.length < 2) return;

    let frame = 0;
    let paused = false;
    let last = performance.now();

    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
    };
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('touchstart', onEnter, { passive: true });

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!paused) {
        el.scrollLeft += dt * 0.035;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) {
          el.scrollLeft -= half;
        }
        const cardW =
          el.firstElementChild instanceof HTMLElement ? el.firstElementChild.offsetWidth + 16 : 300;
        const idx = Math.round(el.scrollLeft / cardW) % profiles.length;
        setActiveIndex(idx);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('touchstart', onEnter);
    };
  }, [profiles.length]);

  return (
    <section id="featured" className="relative overflow-hidden bg-black py-16 text-white sm:py-24">
      {/* Seamless fades into adjacent sections */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_55%)]" />

      <div className="relative mx-auto mb-10 max-w-3xl px-5 text-center sm:mb-14 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-white/40">Featured profiles</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
          Real intros. One scroll away.
        </h2>
        <p className="mt-3 text-sm text-white/50 sm:text-base">
          See how professionals show up on Seenly — with a profile that stands out.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center gap-4 px-5 py-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[360px] w-[min(78vw,280px)] shrink-0 animate-pulse rounded-[1.75rem] bg-white/5 sm:w-[300px]"
            />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="relative mx-auto max-w-md px-5 text-center">
          <p className="text-sm text-white/50">No public profiles yet — be the first.</p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
          >
            Create your Seenly page <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div
            ref={scrollerRef}
            className="relative flex gap-4 overflow-x-auto px-[max(1.25rem,calc(50%-140px))] pb-4 pt-2 scrollbar-none sm:gap-5 sm:px-[max(1.5rem,calc(50%-150px))]"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loop.map((profile, i) => (
              <ProfileCard
                key={`${profile.id}-${i}`}
                profile={profile}
                active={profiles.length === 1 || i % profiles.length === activeIndex}
                onActivate={() => setActiveIndex(i % profiles.length)}
              />
            ))}
          </div>

          {profiles.length > 1 && (
            <div className="relative mt-8 flex justify-center gap-2">
              {profiles.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-label={`Show ${p.name}`}
                  onClick={() => {
                    const el = scrollerRef.current;
                    if (!el) return;
                    const card = el.children[i] as HTMLElement | undefined;
                    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    setActiveIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="relative mt-10 flex flex-wrap justify-center gap-3 px-5">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Browse all profiles
        </Link>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
        >
          Create your Seenly page <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
