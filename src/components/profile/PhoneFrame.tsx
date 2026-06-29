'use client';

import React from 'react';

export const PHONE_OUTER_WIDTH = 320;

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

interface PhoneFrameProps {
  children: React.ReactNode;
  scale?: number;
  compact?: boolean;
  className?: string;
  maxScreenHeight?: string;
}

export default function PhoneFrame({
  children,
  scale = 1,
  compact = false,
  className = '',
  maxScreenHeight = 'min(calc(100dvh - 11rem), 680px)',
}: PhoneFrameProps) {
  const outerWidth = compact ? 280 : PHONE_OUTER_WIDTH;
  const scaledWidth = outerWidth * scale;
  const outerRadius = compact ? '2.75rem' : '3.25rem';
  const innerRadius = compact ? '2.55rem' : '3.05rem';

  return (
    <div className={`mx-auto shrink-0 ${className}`} style={{ width: scaledWidth }}>
      <div
        style={{
          width: outerWidth,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
      >
        <div
          className="relative p-[3px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
          style={{
            borderRadius: outerRadius,
            background: 'linear-gradient(145deg, #5a5a5c 0%, #3a3a3c 35%, #1a1a1c 70%, #2e2e30 100%)',
          }}
        >
          {/* Titanium highlight */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              borderRadius: outerRadius,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.06) 100%)',
            }}
          />

          {/* Side buttons */}
          <div className="absolute -left-[2px] top-[92px] h-7 w-[3px] rounded-l bg-[#48484a]" />
          <div className="absolute -left-[2px] top-[132px] h-12 w-[3px] rounded-l bg-[#48484a]" />
          <div className="absolute -left-[2px] top-[172px] h-12 w-[3px] rounded-l bg-[#48484a]" />
          <div className="absolute -right-[2px] top-[118px] h-[4.5rem] w-[3px] rounded-r bg-[#48484a]" />

          <div
            className="overflow-hidden border border-black/90 bg-black"
            style={{ borderRadius: innerRadius }}
          >
            <StatusBar />

            {/* Dynamic Island */}
            <div className="relative flex justify-center pb-1.5 pt-0.5">
              <div className="relative flex h-[27px] w-[112px] items-center justify-center rounded-full bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
                <div className="absolute right-7 h-2 w-2 rounded-full bg-[#1c1c1e] ring-1 ring-[#3a3a3c]" />
              </div>
            </div>

            {/* Screen */}
            <div
              className="overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ maxHeight: maxScreenHeight }}
            >
              {children}
            </div>

            {/* Home indicator */}
            <div className="flex justify-center bg-black py-2.5">
              <div className="h-[5px] w-[128px] rounded-full bg-white/35" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
