'use client';

import React, { useEffect } from 'react';
import { Check, Loader2, X } from 'lucide-react';

export type ActionStatusState = {
  type: 'loading' | 'success' | 'error';
  message: string;
} | null;

interface ActionStatusProps {
  status: ActionStatusState;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

export default function ActionStatus({
  status,
  onDismiss,
  autoDismissMs = 2800,
}: ActionStatusProps) {
  useEffect(() => {
    if (!status || status.type === 'loading' || !onDismiss) return;
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [status, onDismiss, autoDismissMs]);

  if (!status) return null;

  const styles = {
    loading: 'border-white/15 bg-black/90 text-white/80',
    success: 'border-white/15 bg-black/90 text-white/75',
    error: 'border-red-500/25 bg-black/90 text-red-300/90',
  }[status.type];

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div
        className={`pointer-events-auto flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm shadow-lg backdrop-blur-md ${styles}`}
      >
        {status.type === 'loading' && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" aria-hidden />
        )}
        {status.type === 'success' && (
          <Check className="h-4 w-4 shrink-0 text-white/70" strokeWidth={2.5} aria-hidden />
        )}
        {status.type === 'error' && (
          <X className="h-4 w-4 shrink-0 text-red-400/80" strokeWidth={2.5} aria-hidden />
        )}
        <span>{status.message}</span>
      </div>
    </div>
  );
}

export function LoadingLabel({
  loading,
  loadingText,
  children,
}: {
  loading: boolean;
  loadingText: string;
  children: React.ReactNode;
}) {
  if (!loading) return <>{children}</>;
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {loadingText}
    </span>
  );
}
