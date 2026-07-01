'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { isEmailVerified } from '@/lib/email-verification';

export default function EmailVerifyBanner() {
  const [supabase] = useState(() => createClient());
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [hint, setHint] = useState('');

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && !isEmailVerified(user)) {
      setVisible(true);
      setEmail(user.email || '');
    } else {
      setVisible(false);
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

  if (!visible) return null;

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setHint('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    setHint(error ? error.message : 'Verification email sent — check your inbox.');
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.08] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs text-amber-100/90">
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <span>Verify your email to publish profile changes.</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {hint && <span className="text-[11px] text-amber-200/65">{hint}</span>}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="rounded-md border border-amber-500/25 px-2.5 py-1 text-[11px] font-medium text-amber-100 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
        >
          {resending ? 'Sending…' : 'Resend email'}
        </button>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-md px-2.5 py-1 text-[11px] font-medium text-amber-200/80 transition-colors hover:text-amber-50"
        >
          I&apos;ve verified
        </button>
      </div>
    </div>
  );
}
