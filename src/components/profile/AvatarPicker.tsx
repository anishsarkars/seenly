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
      <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
        Profile Avatar
      </label>
      <div className={`grid grid-cols-4 ${compact ? 'gap-2' : 'gap-3'}`}>
        {PROFILE_AVATARS.map((avatar) => {
          const selected = value === avatar.src;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onChange(avatar.src)}
              className={`group relative aspect-square overflow-hidden rounded-2xl border transition-all ${
                selected
                  ? 'border-white ring-1 ring-white/30'
                  : 'border-zinc-800 hover:border-zinc-600'
              }`}
              aria-label={`Choose ${avatar.label} avatar`}
              aria-pressed={selected}
            >
              <img
                src={avatar.src}
                alt={avatar.label}
                className="h-full w-full object-cover"
              />
              {selected && (
                <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-[9px] font-medium text-white">
                  {avatar.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
