'use client';

import { X } from 'lucide-react';
import { LATEST_SEENLY_UPDATE } from '@/lib/seenly-updates';

interface WhatsNewPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function WhatsNewPanel({ open, onClose }: WhatsNewPanelProps) {
  if (!open) return null;

  const update = LATEST_SEENLY_UPDATE;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close what's new"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3.5 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              What&apos;s new
            </p>
            <h2 id="whats-new-title" className="mt-0.5 text-sm font-semibold text-white">
              Latest update
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
          <p className="text-sm font-medium leading-snug text-white">{update.title}</p>
          <p className="text-xs leading-relaxed text-white/50">{update.description}</p>
          {update.hint && (
            <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[11px] leading-relaxed text-white/45">
              {update.hint}
            </p>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
