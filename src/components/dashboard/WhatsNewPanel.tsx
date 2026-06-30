'use client';

import ProVerifiedTick from '@/components/profile/ProVerifiedTick';
import GoldenVerifiedTick from '@/components/profile/GoldenVerifiedTick';
import { panel } from '@/lib/platform-ui';

interface WhatsNewPanelProps {
  compact?: boolean;
  planTier?: 'free' | 'pro' | 'founder';
}

export default function WhatsNewPanel({
  compact = false,
  planTier = 'free',
}: WhatsNewPanelProps) {
  return (
    <div className="space-y-3">
      <div className={`${panel} space-y-2.5 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="space-y-0.5">
          <p className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>
            Pro verified tick
          </p>
          <p className={`text-white/45 ${compact ? 'text-[10px] leading-relaxed' : 'text-xs leading-relaxed'}`}>
            Seenly Pro members now get a blue verified tick next to their name on public profiles.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <span className={`font-semibold text-white ${compact ? 'text-sm' : 'text-base'}`}>
            yourname
          </span>
          {planTier === 'founder' ? (
            <GoldenVerifiedTick size="sm" />
          ) : planTier === 'pro' ? (
            <ProVerifiedTick size="sm" />
          ) : (
            <ProVerifiedTick size="sm" className="opacity-40" />
          )}
          {planTier === 'free' && (
            <span className={`text-white/35 ${compact ? 'text-[10px]' : 'text-xs'}`}>
              — upgrade to Pro
            </span>
          )}
        </div>
        {planTier === 'founder' && (
          <p className={`text-white/40 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Final boss keeps the golden tick instead.
          </p>
        )}
      </div>

      <div className={`${panel} space-y-3 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="space-y-0.5">
          <p className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>Projects on profile</p>
          <p className={`text-white/45 ${compact ? 'text-[10px] leading-relaxed' : 'text-xs leading-relaxed'}`}>
            Add project links from the dashboard and they now appear in a cleaner project section on your public profile.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className={`text-white/70 ${compact ? 'text-[11px]' : 'text-xs'}`}>
            Add a project title, description, project link, and optional GitHub link.
          </p>
        </div>
      </div>

      <div className={`${panel} space-y-3 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="space-y-0.5">
          <p className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>Resume upload in profile editor</p>
          <p className={`text-white/45 ${compact ? 'text-[10px] leading-relaxed' : 'text-xs leading-relaxed'}`}>
            You can now upload your PDF resume directly inside the profile edit section instead of managing it elsewhere.
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className={`text-white/70 ${compact ? 'text-[11px]' : 'text-xs'}`}>
            Upload once, then your profile keeps the latest resume download button in sync.
          </p>
        </div>
      </div>
    </div>
  );
}
