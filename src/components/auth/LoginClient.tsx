'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { getUserProfile } from '@/db/actions';
import { signInWithGoogle } from '@/lib/auth-client';
import SeenlyLogo from '@/components/SeenlyLogo';
import SiteFooter from '@/components/SiteFooter';
import { btnPrimary, btnSecondary, input, panel } from '@/lib/platform-ui';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'magic'>('password');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('Sign in failed. Please try again.');
    }
  }, [searchParams]);

  const redirectAfterAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/onboarding');
      return;
    }
    try {
      const existing = await getUserProfile(user.id);
      router.push(existing?.user?.username ? '/dashboard' : '/onboarding');
    } catch {
      router.push('/onboarding');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const { error: authError } = await signInWithGoogle(supabase, '/onboarding');
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    await redirectAfterAuth();
    setLoading(false);
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
      setMessage('Check your email for a magic link.');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-black font-geist text-white selection:bg-white selection:text-black">
      <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="hidden w-[42%] max-w-md shrink-0 flex-col justify-between border-r border-white/10 p-10 lg:flex xl:p-14">
        <SeenlyLogo size="lg" />
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
            Show who you are,
            <br />
            <span className="text-white/50">not just what&apos;s on paper.</span>
          </h1>
          <p className="max-w-xs text-sm leading-relaxed text-white/45">
            Sign in to manage your video profile, track views, and share one link everywhere.
          </p>
        </div>
        <p className="text-xs text-white/25">seenly.tech</p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 py-8 sm:px-8">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2 lg:hidden">
            <SeenlyLogo size="md" />
            <p className="text-sm text-white/45">Sign in to your profile</p>
          </div>

          <div className={`${panel} space-y-5 p-6 sm:p-7`}>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-white/45">Continue with Google, email & password, or a magic link.</p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200 disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] uppercase tracking-widest text-white/30">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex rounded-lg border border-white/10 p-0.5">
              <button
                type="button"
                onClick={() => setAuthMethod('password')}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                  authMethod === 'password' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
                }`}
              >
                Email & password
              </button>
              <button
                type="button"
                onClick={() => setAuthMethod('magic')}
                className={`flex-1 rounded-md py-2 text-xs font-medium transition-colors ${
                  authMethod === 'magic' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white/70'
                }`}
              >
                Magic link
              </button>
            </div>

            {authMethod === 'password' ? (
              <form onSubmit={handlePasswordSignIn} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={input}
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={input}
                />
                <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
                  Sign in with password
                </button>
              </form>
            ) : (
              <form onSubmit={sendMagicLink} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={input}
                />
                <button type="submit" disabled={loading} className={`${btnSecondary} w-full`}>
                  Send magic link
                </button>
              </form>
            )}

            {message && <p className="text-center text-sm text-emerald-400/90">{message}</p>}
            {error && <p className="text-center text-sm text-red-400/90">{error}</p>}
          </div>

          <p className="text-center text-sm text-white/40">
            New here?{' '}
            <Link href="/onboarding" className="inline-flex items-center gap-1 text-white/70 hover:text-white">
              Create your profile <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </div>
      </div>
      <SiteFooter compact />
    </div>
  );
}
