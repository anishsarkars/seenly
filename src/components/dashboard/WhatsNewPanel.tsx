'use client';

import AvatarPicker from '@/components/profile/AvatarPicker';
import { btnPrimary, panel } from '@/lib/platform-ui';

interface WhatsNewPanelProps {
  avatar: string;
  onAvatarChange: (src: string) => void;
  onApplyAvatar: () => Promise<void>;
  isSaving: boolean;
  compact?: boolean;
}

export default function WhatsNewPanel({
  avatar,
  onAvatarChange,
  onApplyAvatar,
  isSaving,
  compact = false,
}: WhatsNewPanelProps) {
  return (
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
  );
}
