'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import ProfileView, { type ProfileViewData } from '@/components/profile/ProfileView';

const DESKTOP_PREVIEW_WIDTH = 896;
const PHONE_OUTER_WIDTH = 304;

interface ProfileLivePreviewProps {
  profileData: ProfileViewData;
  username?: string;
  defaultLayout?: 'mobile' | 'desktop';
  className?: string;
  alwaysVisible?: boolean;
}

function PhoneFrame({
  children,
  scale,
}: {
  children: React.ReactNode;
  scale: number;
}) {
  const scaledWidth = PHONE_OUTER_WIDTH * scale;

  return (
    <div className="mx-auto shrink-0" style={{ width: scaledWidth }}>
      <div
        style={{
          width: PHONE_OUTER_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        <div className="rounded-[3rem] border-[8px] border-zinc-800 bg-zinc-900 shadow-2xl ring-1 ring-white/10">
          <div className="relative overflow-hidden rounded-[2.25rem] bg-black">
            <div className="pointer-events-none absolute left-1/2 top-2.5 z-20 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
            <div className="max-h-[min(calc(100dvh-9rem),700px)] overflow-y-auto overscroll-contain pt-9 [-ms-overflow-style:none] [scrollbar-width:thin]">
              {children}
            </div>
          </div>
          <div className="flex justify-center py-2.5">
            <div className="h-1 w-[100px] rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopFrame({
  username,
  children,
}: {
  username?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.03] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-2 min-w-0 flex-1 truncate rounded-md bg-black/40 px-2 py-0.5 text-center text-[10px] text-white/35">
          seenly.tech/{username || 'username'}
        </span>
      </div>
      <div className="max-h-[min(calc(100dvh-9rem),720px)] overflow-y-auto overscroll-contain bg-black">
        {children}
      </div>
    </div>
  );
}

export default function ProfileLivePreview({
  profileData,
  username,
  defaultLayout = 'mobile',
  className = '',
  alwaysVisible = false,
}: ProfileLivePreviewProps) {
  const [layout, setLayout] = useState<'mobile' | 'desktop'>(defaultLayout);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const desktopContentRef = useRef<HTMLDivElement>(null);
  const [phoneScale, setPhoneScale] = useState(1);
  const [desktopScale, setDesktopScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>();

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const updatePhoneScale = () => {
      const available = el.clientWidth - 16;
      setPhoneScale(Math.min(1, available / PHONE_OUTER_WIDTH));
    };

    updatePhoneScale();
    const ro = new ResizeObserver(updatePhoneScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout]);

  useEffect(() => {
    if (layout !== 'desktop') return;

    const container = desktopContainerRef.current;
    const content = desktopContentRef.current;
    if (!container || !content) return;

    const update = () => {
      const scale = Math.min(1, (container.clientWidth - 2) / DESKTOP_PREVIEW_WIDTH);
      setDesktopScale(scale);
      setScaledHeight(content.offsetHeight * scale);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, [layout, profileData]);

  const visibilityClass = alwaysVisible
    ? 'flex'
    : 'hidden lg:flex';

  return (
    <div className={`${visibilityClass} h-full min-h-0 min-w-0 flex-col overflow-hidden ${className}`}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Live preview
        </span>
        <div className="flex shrink-0 rounded-lg border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setLayout('mobile')}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${
              layout === 'mobile'
                ? 'bg-white/10 text-white'
                : 'text-white/45 hover:text-white/70'
            }`}
            aria-pressed={layout === 'mobile'}
          >
            <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setLayout('desktop')}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${
              layout === 'desktop'
                ? 'bg-white/10 text-white'
                : 'text-white/45 hover:text-white/70'
            }`}
            aria-pressed={layout === 'desktop'}
          >
            <Monitor className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
        </div>
      </div>

      <div
        ref={scrollAreaRef}
        className="relative flex flex-1 min-h-0 items-start justify-center overflow-y-auto overflow-x-hidden p-2 sm:p-4"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />

        {layout === 'mobile' ? (
          <PhoneFrame scale={phoneScale}>
            <ProfileView
              profileData={profileData}
              preview
              layout="mobile"
              embedded
            />
          </PhoneFrame>
        ) : (
          <div ref={desktopContainerRef} className="relative z-10 w-full min-w-0 max-w-full">
            <DesktopFrame username={username || profileData.user.username}>
              <div
                className="overflow-hidden"
                style={scaledHeight ? { height: scaledHeight } : undefined}
              >
                <div
                  ref={desktopContentRef}
                  style={{
                    width: DESKTOP_PREVIEW_WIDTH,
                    transform: `scale(${desktopScale})`,
                    transformOrigin: 'top left',
                  }}
                >
                  <ProfileView
                    profileData={profileData}
                    preview
                    layout="desktop"
                    embedded
                  />
                </div>
              </div>
            </DesktopFrame>
          </div>
        )}
      </div>
    </div>
  );
}
