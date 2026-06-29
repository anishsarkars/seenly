'use client';

import { PROFILE_AVATARS } from '@/lib/profile-avatars';

interface AvatarPickerProps {
  value: string;
  onChange: (src: string) => void;
  compact?: boolean;
}

export default function AvatarPicker({ value, onChange, compact = false }: AvatarPickerProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-neutral-500">Avatar</label>
      <div className={`grid grid-cols-4 ${compact ? 'gap-2' : 'gap-3'}`}>
        {PROFILE_AVATARS.map((avatar) => {
          const selected = value === avatar.src;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onChange(avatar.src)}
              className={`aspect-square overflow-hidden rounded-xl transition-all ${
                selected
                  ? 'ring-1 ring-neutral-400'
                  : 'opacity-70 hover:opacity-100'
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
