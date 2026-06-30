'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { btnPrimary, btnSecondary, panel } from '@/lib/platform-ui';
import { type PlanTier } from '@/lib/plans';

interface PricingCardsProps {
  currentTier?: PlanTier;
  compact?: boolean;
  onUpgrade?: (plan: 'pro' | 'founder') => void;
  loadingPlan?: 'pro' | 'founder' | null;
}

const FEATURES = {
  free: [
    '1 public profile',
    '60-second intro video',
    'Max 50 MB upload',
    'Resume upload',
    'Up to 3 projects',
    'Up to 5 social links',
    'Seenly watermark',
    'Basic analytics',
  ],
  pro: [
    'Everything in Free, plus:',
    '3-minute intro video',
    '250 MB uploads',
    'Unlimited projects',
    'Unlimited links',
    'Custom video thumbnail',
    'Remove Seenly branding',
    'Priority support',
  ],
  founder: [
    'Everything in Pro, forever.',
    'Founder badge',
    'All future Pro features',
    'Lifetime updates',
    'Coming soon: more',
  ],
} as const;

export default function PricingCards({
  currentTier = 'free',
  compact = false,
  onUpgrade,
  loadingPlan = null,
}: PricingCardsProps) {
  const [localLoading, setLocalLoading] = useState<'pro' | 'founder' | null>(null);
  const loading = loadingPlan ?? localLoading;

  const startCheckout = async (plan: 'pro' | 'founder') => {
    if (onUpgrade) {
      onUpgrade(plan);
      return;
    }

    setLocalLoading(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed.');
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Checkout failed.');
    } finally {
      setLocalLoading(null);
    }
  };

  return (
    <div className={`grid gap-5 ${compact ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
      {/* Free */}
      <div className={`${panel} flex flex-col p-6 ${currentTier === 'free' ? 'ring-1 ring-white/20' : ''}`}>
        <p className="text-sm font-medium text-white/50">Free</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-white">₹0</p>
        <p className="mt-1 text-sm text-white/45">Perfect for getting started.</p>
        <ul className="mt-6 flex-1 space-y-2.5">
          {FEATURES.free.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-white/65">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" strokeWidth={2} />
              {item}
            </li>
          ))}
        </ul>
        {currentTier === 'free' ? (
          <p className="mt-6 text-center text-xs font-medium uppercase tracking-widest text-white/35">Current plan</p>
        ) : (
          <p className="mt-6 text-center text-xs text-white/30">Included with every account</p>
        )}
      </div>

      {/* Pro */}
      <div className={`${panel} relative flex flex-col overflow-hidden p-6 ${currentTier === 'pro' ? 'ring-1 ring-emerald-400/40' : 'ring-1 ring-emerald-500/20'}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        <p className="text-sm font-medium text-emerald-400/90">Seenly Pro</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-white">
          ₹149<span className="text-base font-normal text-white/45">/month</span>
        </p>
        <ul className="mt-6 flex-1 space-y-2.5">
          {FEATURES.pro.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-white/65">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400/80" strokeWidth={2} />
              {item}
            </li>
          ))}
        </ul>
        {currentTier === 'pro' || currentTier === 'founder' ? (
          <p className="mt-6 text-center text-xs font-medium uppercase tracking-widest text-emerald-400/70">Active</p>
        ) : (
          <button
            type="button"
            disabled={loading === 'pro'}
            onClick={() => startCheckout('pro')}
            className={`${btnPrimary} mt-6 w-full`}
          >
            {loading === 'pro' ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Starting…</span>
            ) : (
              'Upgrade to Pro'
            )}
          </button>
        )}
      </div>

      {/* Founder */}
      <div className={`${panel} relative flex flex-col overflow-hidden p-6 ${currentTier === 'founder' ? 'ring-1 ring-violet-400/40' : ''}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-violet-300/90">Founder</p>
          <Sparkles className="h-3.5 w-3.5 text-violet-300/70" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-lg text-white/35 line-through">₹3,000</p>
          <p className="text-3xl font-bold tracking-tight text-white">₹1,999</p>
        </div>
        <p className="mt-1 text-xs font-medium text-violet-300/70">Launch offer · one-time</p>
        <ul className="mt-6 flex-1 space-y-2.5">
          {FEATURES.founder.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-white/65">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300/80" strokeWidth={2} />
              {item}
            </li>
          ))}
        </ul>
        {currentTier === 'founder' ? (
          <p className="mt-6 text-center text-xs font-medium uppercase tracking-widest text-violet-300/70">You&apos;re a Founder</p>
        ) : currentTier === 'pro' ? (
          <button
            type="button"
            disabled={loading === 'founder'}
            onClick={() => startCheckout('founder')}
            className={`${btnSecondary} mt-6 w-full`}
          >
            {loading === 'founder' ? 'Starting…' : 'Upgrade to Founder'}
          </button>
        ) : (
          <button
            type="button"
            disabled={loading === 'founder'}
            onClick={() => startCheckout('founder')}
            className={`${btnPrimary} mt-6 w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400`}
          >
            {loading === 'founder' ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Starting…</span>
            ) : (
              'Get Founder · ₹1,999'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export function PricingPageFooter() {
  return (
    <p className="text-center text-sm text-white/40">
      Questions?{' '}
      <Link href="mailto:hello@seenly.tech" className="text-white/60 hover:text-white">
        hello@seenly.tech
      </Link>
    </p>
  );
}
