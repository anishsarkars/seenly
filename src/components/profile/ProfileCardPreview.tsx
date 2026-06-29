'use client';

import Link from 'next/link';
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
  videoUrl,
  thumbnailUrl,
  avatar,
}: ProfileCardPreviewProps) {
  const displayName = fullName || username;
  const hasVideo = videoUrl && isPersistedMediaUrl(videoUrl);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-neutral-500">Preview</span>
        <Link
          href={`/${username}`}
          target="_blank"
          className="text-[11px] text-neutral-500 transition-colors hover:text-neutral-300"
        >
          Open
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/[0.06]">
          {avatar ? (
            <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
              {username.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-neutral-200">{displayName}</p>
          {headline && <p className="truncate text-[11px] text-neutral-500">{headline}</p>}
        </div>
      </div>

      <div className="relative aspect-video overflow-hidden rounded-xl bg-white/[0.04]">
        {hasVideo && thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover opacity-80" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-neutral-600">
            No video
          </div>
        )}
      </div>

      <p className="truncate text-[10px] text-neutral-600">seenly.tech/{username}</p>
    </div>
  );
}
