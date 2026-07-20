'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

type FeaturedProfile = {
  id: string;
  name: string;
  headline: string;
  username: string;
  avatar: string;
  poster: string;
  video: string;
  tags: string[];
  work: string;
};

const FEATURED: FeaturedProfile[] = [
  {
    id: '1',
    name: 'Anish Sarkar',
    headline: 'AI engineer building video-first profiles',
    username: 'anish',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120',
    poster: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=600&h=800',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-developer-typing-on-his-computer-34282-large.mp4',
    tags: ['Engineering', 'AI'],
    work: 'Seenly · Product',
  },
  {
    id: '2',
    name: 'Maya Chen',
    headline: 'Product designer for growth teams',
    username: 'maya',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120&h=120',
    poster: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600&h=800',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-42720-large.mp4',
    tags: ['Design', 'UX'],
    work: 'Studio · Figma',
  },
  {
    id: '3',
    name: 'Jordan Lee',
    headline: 'Full-stack builder & founder',
    username: 'jordan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120&h=120',
    poster: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600&h=800',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-man-working-on-his-laptop-308-large.mp4',
    tags: ['Startup', 'Code'],
    work: 'Neo · Build',
  },
  {
    id: '4',
    name: 'Priya Nair',
    headline: 'PM shipping B2B SaaS',
    username: 'priya',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=120&h=120',
    poster: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600&h=800',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-woman-working-with-laptop-at-home-4619-large.mp4',
    tags: ['Product', 'SaaS'],
    work: 'Atlas · Growth',
  },
  {
    id: '5',
    name: 'Sam Ortiz',
    headline: 'Creative technologist & filmmaker',
    username: 'sam',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120&h=120',
    poster: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=600&h=800',
    video: 'https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-camera-and-looking-to-the-side-42758-large.mp4',
    tags: ['Creative', 'Video'],
    work: 'Lens · Motion',
  },
];

function ProfileCard({
  profile,
  active,
  onActivate,
}: {
  profile: FeaturedProfile;
  active: boolean;
  onActivate: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active && playing) {
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [active, playing]);

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
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${playing && active ? 'opacity-0' : 'opacity-100'}`}
          loading="lazy"
        />
        <video
          ref={videoRef}
          src={profile.video}
          poster={profile.poster}
          muted
          playsInline
          loop
          preload="none"
          className={`absolute inset-0 h-full w-full object-cover ${playing && active ? 'opacity-100' : 'opacity-0'}`}
        />

        {!playing && (
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

        <div className="absolute inset-x-3 bottom-3 z-[2] rounded-2xl border border-white/15 bg-white/85 p-3.5 text-left shadow-lg backdrop-blur-md dark:bg-zinc-950/80">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{profile.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {profile.headline}
              </p>
            </div>
            <Link
              href="/onboarding"
              onClick={(e) => e.stopPropagation()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white dark:bg-white dark:text-black"
              aria-label="Create your profile"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-white/15"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function FeaturedProfilesCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = [...FEATURED, ...FEATURED];

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

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
        const cardW = el.firstElementChild instanceof HTMLElement
          ? el.firstElementChild.offsetWidth + 16
          : 300;
        const idx = Math.round(el.scrollLeft / cardW) % FEATURED.length;
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
  }, []);

  return (
    <section id="featured" className="relative overflow-hidden bg-zinc-950 py-16 text-white sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />

      <div className="relative mx-auto mb-10 max-w-3xl px-5 text-center sm:mb-14 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-widest text-white/40">Featured profiles</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">
          Real intros. One scroll away.
        </h2>
        <p className="mt-3 text-sm text-white/50 sm:text-base">
          See how professionals show up on Seenly — then claim yours.
        </p>
      </div>

      <div
        ref={scrollerRef}
        className="relative flex gap-4 overflow-x-auto px-[max(1.25rem,calc(50%-140px))] pb-4 pt-2 scrollbar-none sm:gap-5 sm:px-[max(1.5rem,calc(50%-150px))]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((profile, i) => (
          <ProfileCard
            key={`${profile.id}-${i}`}
            profile={profile}
            active={i % FEATURED.length === activeIndex}
            onActivate={() => setActiveIndex(i % FEATURED.length)}
          />
        ))}
      </div>

      <div className="relative mt-8 flex justify-center gap-2">
        {FEATURED.map((p, i) => (
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

      <div className="relative mt-10 flex justify-center px-5">
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
