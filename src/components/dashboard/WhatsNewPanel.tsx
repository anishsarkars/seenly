'use client';

import React from 'react';
import AvatarPicker from '@/components/profile/AvatarPicker';
import { btnPrimary, muted, panel } from '@/lib/platform-ui';
import { SEENLY_UPDATES, type SeenlyUpdate } from '@/lib/seenly-updates';

interface WhatsNewPanelProps {
  avatar: string;
  onAvatarChange: (src: string) => void;
  onApplyAvatar: () => Promise<void>;
  isSaving: boolean;
  compact?: boolean;
}

const TAG_STYLE = {
  new: 'bg-emerald-400/15 text-emerald-400',
  improved: 'bg-sky-400/15 text-sky-400',
  fix: 'bg-amber-400/15 text-amber-400',
} as const;

function UpdateCard({
  update,
  avatar,
  onAvatarChange,
  onApplyAvatar,
  isSaving,
  compact,
}: {
  update: SeenlyUpdate;
  avatar: string;
  onAvatarChange: (src: string) => void;
  onApplyAvatar: () => Promise<void>;
  isSaving: boolean;
  compact?: boolean;
}) {
  return (
    <article className={`${panel} space-y-3 ${compact ? 'p-3' : 'space-y-4 p-5'}`}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <h3 className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'}`}>{update.title}</h3>
          {update.tag && (
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${TAG_STYLE[update.tag]}`}
            >
              {update.tag}
            </span>
          )}
        </div>
        <p className="text-[10px] text-white/35">{update.date}</p>
      </div>
      <p className={`leading-relaxed text-white/60 ${compact ? 'text-xs' : 'text-sm'}`}>{update.description}</p>

      {update.feature === 'avatars' && (
        <div className={`space-y-3 rounded-lg border border-white/10 bg-white/[0.03] ${compact ? 'p-3' : 'space-y-4 p-4'}`}>
          <AvatarPicker value={avatar} onChange={onAvatarChange} compact />
          <button
            type="button"
            onClick={onApplyAvatar}
            disabled={isSaving}
            className={`${btnPrimary} ${compact ? 'w-full text-xs py-2' : ''}`}
          >
            {isSaving ? 'Saving…' : 'Apply avatar'}
          </button>
        </div>
      )}
    </article>
  );
}

export default function WhatsNewPanel({
  avatar,
  onAvatarChange,
  onApplyAvatar,
  isSaving,
  compact = false,
}: WhatsNewPanelProps) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {!compact && <p className={muted}>Product updates and new features on Seenly.</p>}
      {SEENLY_UPDATES.map((update) => (
        <UpdateCard
          key={update.id}
          update={update}
          avatar={avatar}
          onAvatarChange={onAvatarChange}
          onApplyAvatar={onApplyAvatar}
          isSaving={isSaving}
          compact={compact}
        />
      ))}
    </div>
  );
}
