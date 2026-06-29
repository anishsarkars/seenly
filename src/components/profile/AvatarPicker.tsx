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
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Profile Avatar
        </label>
        <span className="text-[10px] text-zinc-600">Clay-style · 2 male · 2 female</span>
      </div>
      <div className={`grid grid-cols-4 ${compact ? 'gap-2' : 'gap-3'}`}>
        {PROFILE_AVATARS.map((avatar) => {
          const selected = value === avatar.src;
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onChange(avatar.src)}
              className={`group relative aspect-square overflow-hidden rounded-2xl border-2 transition-all ${
                selected
                  ? 'border-white shadow-lg shadow-white/10 scale-[1.03]'
                  : 'border-zinc-800/80 hover:border-zinc-500 hover:scale-[1.02]'
              }`}
              aria-label={`Choose ${avatar.label}, ${avatar.gender} avatar`}
              aria-pressed={selected}
            >
              <img
                src={avatar.src}
                alt={avatar.label}
                className="h-full w-full object-cover"
              />
              <span
                className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                  avatar.gender === 'male'
                    ? 'bg-blue-500/25 text-blue-200'
                    : 'bg-pink-500/25 text-pink-200'
                }`}
              >
                {avatar.gender === 'male' ? 'M' : 'F'}
              </span>
              <span
                className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-4 pb-1.5 text-center text-[9px] font-semibold text-white transition-opacity ${
                  selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {avatar.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
