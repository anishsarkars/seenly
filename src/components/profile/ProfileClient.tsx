'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Pencil } from 'lucide-react';
import { logAnalyticEvent } from '@/db/actions';
import { getEntitlements } from '@/lib/plans';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import ProfileView, { type ProfileViewData } from './ProfileView';

interface ProfileClientProps {
  profileData: ProfileViewData;
  isOwner?: boolean;
}

export default function ProfileClient({ profileData, isOwner = false }: ProfileClientProps) {
  const { user } = profileData;
  const entitlements = useMemo(
    () =>
      getEntitlements({
        plan: user.plan,
        planStatus: user.planStatus,
        planExpiresAt: user.planExpiresAt,
        isFounder: user.isFounder,
      }),
    [user.plan, user.planStatus, user.planExpiresAt, user.isFounder]
  );

  useEffect(() => {
    if (!user.id) return;

    logAnalyticEvent(user.id, 'views', {
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      browser: navigator.userAgent.includes('Chrome')
        ? 'Chrome'
        : navigator.userAgent.includes('Safari')
          ? 'Safari'
          : navigator.userAgent.includes('Firefox')
            ? 'Firefox'
            : 'Other',
      referrer: document.referrer || 'direct',
    });
  }, [user.id]);

  return (
    <ThemeProvider>
      {isOwner && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/85 px-2 py-2 shadow-2xl backdrop-blur-md">
          <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            Live
          </span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-transform hover:scale-105"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
      )}

      <div className={isOwner ? 'pb-28' : undefined}>
        <ProfileView
          profileData={profileData}
          removeBranding={entitlements.removeBranding}
          showProBadge={entitlements.showProBadge}
          showFounderBadge={entitlements.showFounderBadge}
        />
      </div>
    </ThemeProvider>
  );
}
