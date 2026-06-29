'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import ProfileView, { type ProfileViewData } from '@/components/profile/ProfileView';

const DESKTOP_PREVIEW_WIDTH = 896;

interface ProfileLivePreviewProps {
  profileData: ProfileViewData;
  username?: string;
  defaultLayout?: 'mobile' | 'desktop';
  className?: string;
  showOnMobile?: boolean;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[304px] shrink-0">
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
        <span className="ml-2 flex-1 truncate rounded-md bg-black/40 px-2 py-0.5 text-center text-[10px] text-white/35">
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
  showOnMobile = false,
}: ProfileLivePreviewProps) {
  const [layout, setLayout] = useState<'mobile' | 'desktop'>(defaultLayout);
  const desktopContainerRef = useRef<HTMLDivElement>(null);
  const desktopContentRef = useRef<HTMLDivElement>(null);
  const [desktopScale, setDesktopScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>();

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

  const wrapperClass = showOnMobile
    ? `flex h-full min-h-0 flex-col overflow-hidden ${className}`
    : `hidden h-full min-h-0 flex-col overflow-hidden lg:flex ${className}`;

  return (
    <div className={wrapperClass}>
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Live preview
        </span>
        <div className="flex rounded-lg border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setLayout('mobile')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              layout === 'mobile'
                ? 'bg-white/10 text-white'
                : 'text-white/45 hover:text-white/70'
            }`}
            aria-pressed={layout === 'mobile'}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
          </button>
          <button
            type="button"
            onClick={() => setLayout('desktop')}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
              layout === 'desktop'
                ? 'bg-white/10 text-white'
                : 'text-white/45 hover:text-white/70'
            }`}
            aria-pressed={layout === 'desktop'}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 min-h-0 items-start justify-center overflow-y-auto overflow-x-hidden p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />

        {layout === 'mobile' ? (
          <PhoneFrame>
            <ProfileView
              profileData={profileData}
              preview
              layout="mobile"
              embedded
            />
          </PhoneFrame>
        ) : (
          <div ref={desktopContainerRef} className="relative z-10 w-full max-w-full">
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
