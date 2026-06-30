'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { FreeTierIcon, FounderTierIcon, ProTierIcon } from '@/components/billing/pricing-tier-icons';
import { PLAN_PRICES, FINAL_BOSS_LABEL, SUPPORT_EMAIL } from '@/lib/plan-marketing';
import { type PlanTier } from '@/lib/plans';

const sectionBadge =
  'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/60';
const sectionTitle =
  'text-2xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl';
const bottomPill =
  'w-full max-w-md rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm leading-relaxed text-white/50 backdrop-blur-sm sm:w-auto sm:px-6';
const ctaPrimary =
  'inline-flex items-center justify-center rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] hover:bg-zinc-200 disabled:opacity-50';
const ctaGhost =
  'text-sm font-medium text-white/60 transition-colors hover:text-white';

interface PricingTierGridProps {
  variant?: 'landing' | 'checkout';
  currentTier?: PlanTier;
  isSignedIn?: boolean;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

export default function PricingTierGrid({
  variant = 'landing',
  currentTier = 'free',
  isSignedIn = false,
  showHeader = true,
  compact = false,
  className = '',
}: PricingTierGridProps) {
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'founder' | null>(null);

  const startCheckout = async (plan: 'pro' | 'founder') => {
    if (!isSignedIn) {
      window.location.href = `/login?next=${encodeURIComponent('/pricing')}`;
      return;
    }

    setLoadingPlan(plan);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401 || data.code === 'auth_required') {
          window.location.href = `/login?next=${encodeURIComponent('/pricing')}`;
          return;
        }
        throw new Error(typeof data.error === 'string' ? data.error : 'Checkout failed.');
      }
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Checkout failed.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const tiers = [
    {
      id: 'free' as const,
      label: 'Free',
      price: '₹0',
      description: '60s intro video, 50 MB upload, and up to 3 projects.',
      icon: <FreeTierIcon />,
      landingHref: '/onboarding',
      landingLabel: 'Get started',
    },
    {
      id: 'pro' as const,
      label: 'Pro',
      price: PLAN_PRICES.pro.amount,
      period: PLAN_PRICES.pro.period,
      description: '3-min video, 250 MB upload, unlimited projects, no watermark.',
      icon: <ProTierIcon />,
      landingHref: '/pricing',
      landingLabel: 'Upgrade to Pro',
    },
    {
      id: 'founder' as const,
      label: FINAL_BOSS_LABEL,
      price: PLAN_PRICES.founder.amount,
      description: 'Everything in Pro, forever — Final boss badge and lifetime updates.',
      icon: <FounderTierIcon />,
      landingHref: '/pricing',
      landingLabel: 'View Final boss',
    },
  ];

  const renderCta = (tierId: 'free' | 'pro' | 'founder', landingHref: string, landingLabel: string) => {
    if (variant === 'landing') {
      return (
        <Link href={landingHref} className={tierId === 'pro' ? ctaPrimary : ctaGhost}>
          {landingLabel}
        </Link>
      );
    }

    if (tierId === 'free') {
      if (currentTier === 'free') {
        return <p className="text-xs font-medium uppercase tracking-widest text-white/35">Current plan</p>;
      }
      return <p className="text-xs text-white/35">Included with every account</p>;
    }

    if (tierId === 'pro') {
      if (currentTier === 'pro' || currentTier === 'founder') {
        return <p className="text-xs font-medium uppercase tracking-widest text-emerald-400/70">Active</p>;
      }
      return (
        <button
          type="button"
          disabled={loadingPlan === 'pro'}
          onClick={() => startCheckout('pro')}
          className={ctaPrimary}
        >
          {loadingPlan === 'pro' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Starting…
            </span>
          ) : (
            'Upgrade to Pro'
          )}
        </button>
      );
    }

    if (currentTier === 'founder') {
      return <p className="text-xs font-medium tracking-tight text-white/45">You&apos;re Final boss!</p>;
    }
    return (
      <button
        type="button"
        disabled={loadingPlan === 'founder'}
        onClick={() => startCheckout('founder')}
        className={currentTier === 'pro' ? ctaGhost : ctaPrimary}
      >
        {loadingPlan === 'founder' ? 'Starting…' : `Get Final boss · ${PLAN_PRICES.founder.amount}`}
      </button>
    );
  };

  const gapClass = compact ? 'gap-10 sm:gap-12' : 'gap-16 sm:gap-20 md:gap-24';
  const gridGap = compact ? 'gap-8 sm:gap-6' : 'gap-12 sm:gap-8';

  return (
    <div className={`mx-auto flex max-w-4xl flex-col items-center text-center ${gapClass} ${className}`}>
      {showHeader && (
        <div className="space-y-4 sm:space-y-5">
          <span className={sectionBadge}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Pricing
          </span>
          <h2 className={sectionTitle}>
            Simple plans. Start free.<br />
            <span className="text-white/60">Upgrade when you&apos;re ready to grow.</span>
          </h2>
        </div>
      )}

      <div className={`grid w-full grid-cols-1 sm:grid-cols-3 ${gridGap}`}>
        {tiers.map((tier) => (
          <div key={tier.id} className="flex flex-col items-center gap-4 sm:gap-5">
            <div className={`${currentTier === tier.id && variant === 'checkout' ? 'text-white/70' : 'text-white/50'}`}>
              {tier.icon}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold tracking-tight text-white">
                {tier.label}
                <span className="font-normal text-white/45">
                  {' '}
                  · {tier.price}
                  {tier.period ?? ''}
                </span>
              </p>
              <p className="mx-auto max-w-xs px-2 text-sm leading-relaxed text-white/50 sm:max-w-[12rem] sm:px-0">
                {tier.description}
              </p>
              <div className="pt-2">{renderCta(tier.id, tier.landingHref, tier.landingLabel)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={bottomPill}>
        Pro at{' '}
        <span className="font-semibold text-white/80">
          {PLAN_PRICES.pro.amount}
          {PLAN_PRICES.pro.period}
        </span>
        {' '}· Final boss launch{' '}
        <span className="font-semibold text-white/80">{PLAN_PRICES.founder.amount}</span>
        {PLAN_PRICES.founder.was && (
          <span className="text-white/35"> (was {PLAN_PRICES.founder.was})</span>
        )}
      </div>
    </div>
  );
}

export function PricingPageFooter() {
  return (
    <p className="text-center text-sm text-white/50">
      Questions?{' '}
      <Link href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-white/70 transition-colors hover:text-white">
        {SUPPORT_EMAIL}
      </Link>
    </p>
  );
}
