'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Lock, RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';
import ProfileView, { type ProfileViewData } from '@/components/profile/ProfileView';
import PhoneFrame, { PHONE_OUTER_WIDTH } from '@/components/profile/PhoneFrame';

const DESKTOP_PREVIEW_WIDTH = 896;

interface ProfileLivePreviewProps {
  profileData: ProfileViewData;
  username?: string;
  defaultLayout?: 'mobile' | 'desktop';
  className?: string;
  alwaysVisible?: boolean;
  panelMode?: 'side' | 'bottom';
  removeBranding?: boolean;
  showProBadge?: boolean;
  showFounderBadge?: boolean;
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
  panelMode = 'side',
  removeBranding = false,
  showProBadge = false,
  showFounderBadge = false,
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
      const available = el.clientWidth - (panelMode === 'bottom' ? 8 : 16);
      const base = panelMode === 'bottom' ? 280 : PHONE_OUTER_WIDTH;
      setPhoneScale(Math.min(1, available / base));
    };

    updatePhoneScale();
    const ro = new ResizeObserver(updatePhoneScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout, panelMode]);

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
        className={`relative flex flex-1 min-h-0 items-start justify-center overflow-y-auto overflow-x-hidden p-3 sm:p-5 ${
          panelMode === 'bottom'
            ? 'bg-[#050505]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_65%)] bg-[#0a0a0a]'
        }`}
      >
        {layout === 'mobile' ? (
          <PhoneFrame
            scale={phoneScale}
            compact={panelMode === 'bottom'}
            className="pb-2"
            maxScreenHeight={
              panelMode === 'bottom'
                ? 'min(calc(100dvh - 14rem), 520px)'
                : 'min(calc(100dvh - 11rem), 680px)'
            }
          >
            <ProfileView
              profileData={profileData}
              preview
              layout="mobile"
              embedded
              removeBranding={removeBranding}
              showProBadge={showProBadge}
              showFounderBadge={showFounderBadge}
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
                    removeBranding={removeBranding}
                    showProBadge={showProBadge}
                    showFounderBadge={showFounderBadge}
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
