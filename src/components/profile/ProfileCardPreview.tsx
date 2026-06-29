'use client';

import Link from 'next/link';
import { MapPin, Play } from 'lucide-react';
import { isPersistedMediaUrl } from '@/lib/storage';

interface ProfileCardPreviewProps {
  username: string;
  fullName?: string;
  headline?: string;
  location?: string;
  bio?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  avatar?: string;
}

export default function ProfileCardPreview({
  username,
  fullName,
  headline,
  location,
  bio,
  videoUrl,
  thumbnailUrl,
  avatar,
}: ProfileCardPreviewProps) {
  const displayName = fullName || username;
  const hasVideo = videoUrl && isPersistedMediaUrl(videoUrl);

  return (
    <div className="rounded-2xl border border-zinc-900 bg-zinc-950/80 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Profile Preview</span>
        <Link
          href={`/${username}`}
          target="_blank"
          className="text-[10px] font-semibold text-zinc-400 transition-colors hover:text-white"
        >
          Open ↗
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center">
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-zinc-400">{username.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{displayName}</p>
          {headline && <p className="truncate text-[10px] text-zinc-400">{headline}</p>}
          {location && (
            <p className="mt-0.5 flex items-center gap-0.5 truncate text-[9px] text-zinc-500">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {location}
            </p>
          )}
        </div>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-black">
        {hasVideo ? (
          <>
            {thumbnailUrl && (
              <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-black">
                <Play className="h-3 w-3 fill-current ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-[9px] text-zinc-600">No video yet</div>
        )}
      </div>

      {bio && (
        <p className="line-clamp-2 text-[10px] leading-relaxed text-zinc-500 italic">&ldquo;{bio}&rdquo;</p>
      )}

      <p className="truncate text-[9px] font-mono text-zinc-600">seenly.tech/{username}</p>
    </div>
  );
}
