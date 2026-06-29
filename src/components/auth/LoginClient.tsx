'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

export default function LoginClient() {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getRedirectTo = () =>
    `${window.location.origin}/auth/callback?next=/onboarding`;

  const signInWithProvider = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: getRedirectTo() },
    });
    if (authError) setError(authError.message);
    setLoading(false);
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getRedirectTo() },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setMessage('Check your email for a magic link to sign in.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2 text-center">
          <Link href="/" className="text-xl font-semibold tracking-tight">Seenly</Link>
          <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
          <p className="text-sm text-white/50">Create your public profile in minutes.</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => signInWithProvider('google')}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Continue with Google
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => signInWithProvider('github')}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            Continue with GitHub
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-widest text-white/30">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={sendMagicLink} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/25"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            Send magic link
          </button>
        </form>

        {message && <p className="text-center text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-center text-sm text-red-400">{error}</p>}

        <p className="text-center text-sm text-white/40">
          New here?{' '}
          <Link href="/onboarding" className="text-white/70 hover:text-white">
            Create your profile
          </Link>
        </p>
      </div>
    </div>
  );
}
