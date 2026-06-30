'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';
import { isUsernameUnique } from '@/db/actions';
import { validateUsername } from '@/lib/username';

interface UsernameClaimBarProps {
  className?: string;
  title?: string;
  /** @deprecated use variant="hero" */
  hero?: boolean;
  variant?: 'hero' | 'cta';
  initialUsername?: string;
}

export default function UsernameClaimBar({
  className = '',
  title = "Claim your Seenly link before it's taken",
  hero = false,
  variant: variantProp,
  initialUsername = '',
}: UsernameClaimBarProps) {
  const variant = variantProp ?? (hero ? 'hero' : 'cta');
  const isHero = variant === 'hero';

  const router = useRouter();
  const [username, setUsername] = useState(() =>
    initialUsername ? initialUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30) : ''
  );
  const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!initialUsername) return;
    const clean = initialUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
    if (clean) setUsername(clean);
  }, [initialUsername]);

  useEffect(() => {
    const clean = username.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (clean !== username) {
      setUsername(clean);
      return;
    }

    if (!clean) {
      setStatus('idle');
      setMessage('');
      return;
    }

    const validation = validateUsername(clean);
    if (!validation.valid) {
      setStatus('invalid');
      setMessage(validation.error || 'Invalid username');
      return;
    }

    setStatus('checking');
    setMessage('');

    const timer = setTimeout(async () => {
      try {
        const unique = await isUsernameUnique(clean);
        if (unique) {
          setStatus('available');
          setMessage('Available');
        } else {
          setStatus('taken');
          setMessage('Already taken');
        }
      } catch {
        setStatus('invalid');
        setMessage('Could not check availability');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [username]);

  const handleClaim = () => {
    if (status !== 'available' || !username) return;
    router.push(`/onboarding?username=${encodeURIComponent(username)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleClaim();
  };

  return (
    <div
      className={`mx-auto w-full max-w-xl ${isHero ? 'space-y-2.5' : 'space-y-4'} ${
        isHero ? 'text-left' : 'text-center'
      } ${className}`}
    >
      {title ? (
        <h2
          className={`font-bold tracking-tight text-white ${
            isHero
              ? 'text-left text-lg sm:text-xl'
              : 'text-xl sm:text-2xl md:text-3xl'
          }`}
        >
          {title}
        </h2>
      ) : isHero ? (
        <p className="text-xs font-medium uppercase tracking-widest text-white/55 drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]">
          Reserve your link
        </p>
      ) : null}

      <div
        className={`flex flex-col gap-2 p-2 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5 sm:pl-5 ${
          isHero
            ? 'rounded-2xl border border-white/20 bg-black/55 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md sm:rounded-full'
            : 'rounded-2xl border border-white/10 bg-white/[0.06] sm:rounded-full'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 px-2 sm:px-0">
          <span className="shrink-0 text-sm text-white/50">seenly.tech/</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="username"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />
          <span className="shrink-0 pl-1">
            {status === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
            {status === 'available' && <Check className="h-4 w-4 text-emerald-400" />}
            {(status === 'taken' || status === 'invalid') && <X className="h-4 w-4 text-red-400/80" />}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClaim}
          disabled={status !== 'available'}
          className="shrink-0 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-full sm:py-2.5"
        >
          {initialUsername ? 'Create account' : 'Claim my link'}
        </button>
      </div>

      {message && (
        <p
          className={`text-xs ${isHero ? 'text-left' : 'text-center'} ${
            status === 'available'
              ? 'text-emerald-400/90'
              : status === 'taken' || status === 'invalid'
                ? 'text-red-400/80'
                : 'text-white/35'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
