'use client';

import { PROFILE_AVATARS } from '@/lib/profile-avatars';
import { label } from '@/lib/platform-ui';

interface AvatarPickerProps {
  value: string;
  onChange: (src: string) => void;
  compact?: boolean;
}

export default function AvatarPicker({ value, onChange, compact = false }: AvatarPickerProps) {
  return (
    <div className="space-y-2">
      <label className={label}>Avatar</label>
      <div className={`grid grid-cols-4 ${compact ? 'gap-2' : 'gap-3'}`}>
        {PROFILE_AVATARS.map((avatar) => {
          const selected = value === avatar.src;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onChange(avatar.src)}
              className={`aspect-square overflow-hidden rounded-full border-2 transition-all ${
                selected
                  ? 'border-white/50 ring-2 ring-white/15'
                  : 'border-transparent opacity-90 hover:opacity-100'
              }`}
              aria-label={`Choose ${avatar.label} avatar`}
              aria-pressed={selected}
            >
              <img src={avatar.src} alt={avatar.label} className="h-full w-full object-cover" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
