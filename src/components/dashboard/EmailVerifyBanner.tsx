'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Mail } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { isEmailVerified } from '@/lib/email-verification';
import { formatAuthError, isAuthRateLimitError } from '@/lib/auth-errors';

const RESEND_COOLDOWN_MS = 60_000;

export default function EmailVerifyBanner() {
  const [supabase] = useState(() => createClient());
  const [checked, setChecked] = useState(false);
  const [verified, setVerified] = useState(true);
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [hint, setHint] = useState('');
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setChecked(false);
      return;
    }
    setChecked(true);
    setEmail(user.email || '');
    setVerified(isEmailVerified(user));
    if (isEmailVerified(user)) {
      setHint('');
    }
  }, [supabase]);

  useEffect(() => {
    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => subscription.unsubscribe();
  }, [supabase, refresh]);

  if (!checked || verified) return null;

  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  const resendDisabled = resending || cooldownLeft > 0;

  const handleResend = async () => {
    if (!email || resendDisabled) return;
    setResending(true);
    setHint('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) {
      setHint(isAuthRateLimitError(error) ? formatAuthError(error) : error.message);
      if (isAuthRateLimitError(error)) {
        setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS * 5);
      }
      return;
    }
    setHint('Verification email sent.');
    setCooldownUntil(Date.now() + RESEND_COOLDOWN_MS);
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs text-amber-100/90">
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span>Email not verified yet — optional; check your inbox if you want to confirm.</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {hint && <span className="text-[11px] text-amber-200/65">{hint}</span>}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendDisabled}
          className="rounded-md border border-amber-500/25 px-2.5 py-1 text-[11px] font-medium text-amber-100 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
        >
          {resending ? 'Sending…' : cooldownLeft > 0 ? `Resend (${cooldownLeft}s)` : 'Resend'}
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-amber-200/80 transition-colors hover:text-amber-50"
        >
          <CheckCircle2 className="h-3 w-3" />
          Refresh
        </button>
      </div>
    </div>
  );
}
