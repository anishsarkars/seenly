'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { isPersistedMediaUrl } from '@/lib/storage';
import { panel } from '@/lib/platform-ui';

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
  videoUrl,
  thumbnailUrl,
  avatar,
}: ProfileCardPreviewProps) {
  const displayName = fullName || username;
  const hasVideo = videoUrl && isPersistedMediaUrl(videoUrl);

  return (
    <div className={`${panel} overflow-hidden p-4`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-white/40">Live preview</span>
        <Link
          href={`/${username}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-white/50 transition-colors hover:text-white"
        >
          Open <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black">
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/40">
              {username.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          {headline && <p className="truncate text-xs text-white/50">{headline}</p>}
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-lg border border-white/10 bg-black">
        {hasVideo && thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="mx-auto block h-auto w-full max-h-40 object-contain" />
        ) : (
          <div className="flex aspect-video items-center justify-center text-xs text-white/30">No video yet</div>
        )}
      </div>

      <p className="mt-3 truncate text-[11px] font-mono text-white/35">seenly.tech/{username}</p>
    </div>
  );
}
