'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Lock, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import ProfileView, { type ProfileViewData } from '@/components/profile/ProfileView';

const DESKTOP_PREVIEW_WIDTH = 896;
const PHONE_OUTER_WIDTH = 320;

interface ProfileLivePreviewProps {
  profileData: ProfileViewData;
  username?: string;
  defaultLayout?: 'mobile' | 'desktop';
  className?: string;
  alwaysVisible?: boolean;
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[11px] font-semibold text-white">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <svg className="h-2.5 w-3.5" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
          <rect x="0" y="8" width="2.5" height="4" rx="0.5" opacity="0.4" />
          <rect x="4" y="5" width="2.5" height="7" rx="0.5" opacity="0.6" />
          <rect x="8" y="2" width="2.5" height="10" rx="0.5" opacity="0.8" />
          <rect x="12" y="0" width="2.5" height="12" rx="0.5" />
        </svg>
        <svg className="h-2.5 w-3.5" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
          <path d="M8 2C5.5 2 3.2 3 1.5 4.7L0 3.2C2.2 1.2 5 0 8 0s5.8 1.2 8 3.2l-1.5 1.5C12.8 3 10.5 2 8 2zm0 3c-1.5 0-2.9.6-3.9 1.6L2.6 5.1C4.1 3.6 6 2.7 8 2.7s3.9.9 5.4 2.4l-1.5 1.5C10.9 5.6 9.5 5 8 5zm0 3c-.8 0-1.5.3-2.1.9L8 11l2.1-2.1c-.6-.6-1.3-.9-2.1-.9z" />
        </svg>
        <svg className="h-3 w-5" viewBox="0 0 24 12" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="currentColor" strokeOpacity="0.35" />
          <rect x="2" y="2" width="14" height="8" rx="1.5" fill="currentColor" />
          <rect x="21" y="4" width="2.5" height="4" rx="1" fill="currentColor" strokeOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
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
    <div className="mx-auto shrink-0 pb-2" style={{ width: scaledWidth }}>
      <div
        style={{
          width: PHONE_OUTER_WIDTH,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        {/* Device shell */}
        <div className="relative rounded-[3.25rem] bg-gradient-to-b from-[#4a4a4c] via-[#2c2c2e] to-[#1c1c1e] p-[3px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)_inset]">
          {/* Side buttons */}
          <div className="absolute -left-[2px] top-[88px] h-8 w-[3px] rounded-l bg-[#3a3a3c]" />
          <div className="absolute -left-[2px] top-[130px] h-14 w-[3px] rounded-l bg-[#3a3a3c]" />
          <div className="absolute -left-[2px] top-[172px] h-14 w-[3px] rounded-l bg-[#3a3a3c]" />
          <div className="absolute -right-[2px] top-[120px] h-20 w-[3px] rounded-r bg-[#3a3a3c]" />

          <div className="overflow-hidden rounded-[3.1rem] border border-black/80 bg-black">
            <StatusBar />

            {/* Dynamic Island */}
            <div className="relative flex justify-center pb-1">
              <div className="h-[26px] w-[108px] rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
            </div>

            {/* Screen */}
            <div className="max-h-[min(calc(100dvh-11rem),680px)] overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {children}
            </div>

            {/* Home indicator */}
            <div className="flex justify-center bg-black py-2">
              <div className="h-[5px] w-[120px] rounded-full bg-white/30" />
            </div>
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
  const url = `seenly.tech/${username || 'username'}`;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-[#202124] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)]">
      {/* Window title bar / tabs */}
      <div className="flex items-end gap-0.5 bg-[#35363a] px-2 pt-2">
        <div className="flex min-w-0 max-w-[200px] items-center gap-2 rounded-t-lg border border-b-0 border-white/10 bg-[#202124] px-3 py-2">
          <div className="h-3 w-3 shrink-0 rounded-full bg-white/20" />
          <span className="truncate text-[10px] text-white/60">{url}</span>
          <span className="text-[10px] text-white/25">×</span>
        </div>
        <div className="mb-2 ml-1 text-sm leading-none text-white/25">+</div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#202124] px-3 py-2">
        <div className="flex items-center gap-1 text-white/30">
          <ChevronLeft className="h-3.5 w-3.5" />
          <ChevronRight className="h-3.5 w-3.5" />
          <RotateCw className="h-3 w-3" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#35363a] px-3 py-1.5">
          <Lock className="h-3 w-3 shrink-0 text-emerald-400/80" strokeWidth={2} />
          <span className="truncate text-[11px] text-white/55">{url}</span>
        </div>
      </div>

      {/* Viewport */}
      <div className="max-h-[min(calc(100dvh-11rem),720px)] overflow-y-auto overscroll-contain bg-black [-ms-overflow-style:none] [scrollbar-width:thin]">
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

  const visibilityClass = alwaysVisible ? 'flex' : 'hidden lg:flex';

  return (
    <div className={`${visibilityClass} h-full min-h-0 min-w-0 flex-col overflow-hidden ${className}`}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
        <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Live preview
        </span>
        <div className="flex shrink-0 rounded-lg border border-white/10 bg-white/[0.03] p-0.5">
          <button
            type="button"
            onClick={() => setLayout('mobile')}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] font-medium transition-colors sm:gap-1.5 sm:px-2.5 sm:text-[11px] ${
              layout === 'mobile'
                ? 'bg-white/12 text-white shadow-sm'
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
                ? 'bg-white/12 text-white shadow-sm'
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
        className="relative flex flex-1 min-h-0 items-start justify-center overflow-y-auto overflow-x-hidden bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04)_0%,transparent_65%)] p-3 sm:p-4"
      >
        {layout === 'mobile' ? (
          <PhoneFrame scale={phoneScale}>
            <ProfileView profileData={profileData} preview layout="mobile" embedded />
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
                  <ProfileView profileData={profileData} preview layout="desktop" embedded />
                </div>
              </div>
            </DesktopFrame>
          </div>
        )}
      </div>
    </div>
  );
}
