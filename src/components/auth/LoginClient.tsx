'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { signInWithOAuth } from '@/lib/auth-client';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function LoginClient() {
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('Sign in failed. Please try again.');
    }
  }, [searchParams]);

  const handleOAuth = async (provider: 'google' | 'github') => {
    setError('');
    setLoading(true);
    const { error: authError } = await signInWithOAuth(supabase, provider, '/onboarding');
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/onboarding')}`,
      },
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
            onClick={() => handleOAuth('google')}
            className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleOAuth('github')}
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
            className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
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
