'use client';

import AvatarPicker from '@/components/profile/AvatarPicker';
import ProVerifiedTick from '@/components/profile/ProVerifiedTick';
import GoldenVerifiedTick from '@/components/profile/GoldenVerifiedTick';
import { btnPrimary, panel } from '@/lib/platform-ui';

interface WhatsNewPanelProps {
  avatar: string;
  onAvatarChange: (src: string) => void;
  onApplyAvatar: () => Promise<void>;
  isSaving: boolean;
  compact?: boolean;
  planTier?: 'free' | 'pro' | 'founder';
}

export default function WhatsNewPanel({
  avatar,
  onAvatarChange,
  onApplyAvatar,
  isSaving,
  compact = false,
  planTier = 'free',
}: WhatsNewPanelProps) {
  return (
    <div className={`space-y-3 ${compact ? '' : ''}`}>
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
          <p className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>Pick an avatar</p>
          <p className={`text-white/45 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Premium 3D faces for your profile.
          </p>
        </div>
        <AvatarPicker value={avatar} onChange={onAvatarChange} compact />
        <button
          type="button"
          onClick={onApplyAvatar}
          disabled={isSaving}
          className={`${btnPrimary} ${compact ? 'w-full text-xs py-2' : 'w-full'}`}
        >
          {isSaving ? 'Saving…' : 'Apply avatar'}
        </button>
      </div>
    </div>
  );
}
