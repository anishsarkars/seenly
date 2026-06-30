'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2 } from 'lucide-react';
import { getPlanFeatureList } from '@/lib/plan-features';
import { PLAN_PRICES, FINAL_BOSS_LABEL, SUPPORT_EMAIL } from '@/lib/plan-marketing';
import { btnPrimary, btnSecondary } from '@/lib/platform-ui';
import { type PlanTier } from '@/lib/plans';

const COMPARE_FEATURES: Record<PlanTier, string[]> = {
  free: ['60s video', '50 MB upload', 'Seenly watermark'],
  pro: ['3 min video', '250 MB upload', 'No branding'],
  founder: ['Pro forever', 'Golden tick', 'One-time payment'],
};

interface PricingTierGridProps {
  variant?: 'landing' | 'checkout';
  layout?: 'grid' | 'compare';
  currentTier?: PlanTier;
  isSignedIn?: boolean;
  showHeader?: boolean;
  compact?: boolean;
  className?: string;
}

export default function PricingTierGrid({
  variant = 'landing',
  layout = 'grid',
  currentTier = 'free',
  isSignedIn = false,
  showHeader = true,
  compact = false,
  className = '',
}: PricingTierGridProps) {
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'founder' | null>(null);
  const isCompare = layout === 'compare';

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

  const tiers: Array<{
    id: PlanTier;
    label: string;
    tagline: string;
    price: string;
    period?: string;
    wasPrice?: string;
    note?: string;
    landingHref: string;
    landingLabel: string;
  }> = [
    {
      id: 'free',
      label: 'Free',
      tagline: 'Get started with a video profile.',
      price: '₹0',
      landingHref: '/onboarding',
      landingLabel: 'Get started',
    },
    {
      id: 'pro',
      label: 'Seenly Pro',
      tagline: 'Longer videos and a cleaner profile.',
      price: PLAN_PRICES.pro.amount,
      period: PLAN_PRICES.pro.period,
      landingHref: '/pricing',
      landingLabel: 'Upgrade to Pro',
    },
    {
      id: 'founder',
      label: FINAL_BOSS_LABEL,
      tagline: 'Pro forever. One payment.',
      price: PLAN_PRICES.founder.amount,
      period: ' one-time',
      wasPrice: PLAN_PRICES.founder.was,
      note: 'Launch offer',
      landingHref: '/pricing',
      landingLabel: 'Get Final boss',
    },
  ];

  const renderCta = (tierId: PlanTier, landingHref: string, landingLabel: string) => {
    const ctaClass = isCompare
      ? `${btnPrimary} w-full !py-2 text-xs`
      : `${btnPrimary} w-full`;
    const ghostClass = isCompare
      ? `${btnSecondary} w-full !py-2 text-xs`
      : `${btnSecondary} w-full`;

    if (variant === 'landing') {
      if (tierId === 'pro') {
        return <Link href={landingHref} className={ctaClass}>{landingLabel}</Link>;
      }
      return <Link href={landingHref} className={ghostClass}>{landingLabel}</Link>;
    }

    if (tierId === 'free') {
      if (currentTier === 'free') {
        return <p className="text-center text-xs text-white/40">Current plan</p>;
      }
      return <p className="text-center text-xs text-white/35">Included</p>;
    }

    if (tierId === 'pro') {
      if (currentTier === 'pro' || currentTier === 'founder') {
        return <p className="text-center text-xs text-white/40">Active</p>;
      }
      return (
        <button type="button" disabled={loadingPlan === 'pro'} onClick={() => startCheckout('pro')} className={ctaClass}>
          {loadingPlan === 'pro' ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting…
            </span>
          ) : (
            'Upgrade to Pro'
          )}
        </button>
      );
    }

    if (currentTier === 'founder') {
      return <p className="text-center text-xs text-white/40">Your plan</p>;
    }

    return (
      <button
        type="button"
        disabled={loadingPlan === 'founder'}
        onClick={() => startCheckout('founder')}
        className={currentTier === 'pro' ? ghostClass : ctaClass}
      >
        {loadingPlan === 'founder' ? 'Starting…' : `Get Final boss · ${PLAN_PRICES.founder.amount}`}
      </button>
    );
  };

  const cardShell = (tier: (typeof tiers)[number]) => {
    const features = isCompare
      ? COMPARE_FEATURES[tier.id]
      : getPlanFeatureList(tier.id);
    const visibleFeatures = compact && !isCompare
      ? features.slice(0, tier.id === 'pro' ? 5 : 4)
      : features;
    const isCurrent = variant === 'checkout' && currentTier === tier.id;

    if (isCompare) {
      return (
        <div
          key={tier.id}
          className={`flex flex-col rounded-lg border border-white/10 bg-white/[0.03] p-4 ${
            isCurrent ? 'ring-1 ring-white/20' : ''
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-white">{tier.label}</p>
            {tier.note && (
              <span className="text-[10px] uppercase tracking-wider text-white/35">{tier.note}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
            {tier.wasPrice && (
              <span className="text-sm text-white/30 line-through">{tier.wasPrice}</span>
            )}
            <span className="text-xl font-semibold tracking-tight text-white">
              {tier.price}
              {tier.period && <span className="text-xs font-normal text-white/40">{tier.period}</span>}
            </span>
          </div>
          <ul className="mt-3 flex-1 space-y-1.5">
            {visibleFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-xs text-white/50">
                <Check className="h-3 w-3 shrink-0 text-white/30" strokeWidth={2} />
                {feature}
              </li>
            ))}
          </ul>
          <div className="mt-4">{renderCta(tier.id, tier.landingHref, tier.landingLabel)}</div>
        </div>
      );
    }

    return (
      <div
        key={tier.id}
        className={`relative flex h-full flex-col rounded-lg border border-white/10 bg-white/[0.03] p-5 text-left sm:p-6 ${
          isCurrent ? 'ring-1 ring-white/20' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">{tier.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/45">{tier.tagline}</p>
          </div>
          {tier.note && (
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-white/35">
              {tier.note}
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-baseline gap-2">
          {tier.wasPrice && (
            <span className="text-base font-medium text-white/30 line-through">{tier.wasPrice}</span>
          )}
          <span className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {tier.price}
            {tier.period && <span className="text-sm font-normal text-white/40">{tier.period}</span>}
          </span>
        </div>

        <ul className={`mt-5 flex-1 space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          {visibleFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-white/55">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" strokeWidth={2} />
              <span className={feature.endsWith(':') ? 'font-medium text-white/70' : ''}>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">{renderCta(tier.id, tier.landingHref, tier.landingLabel)}</div>
      </div>
    );
  };

  return (
    <div
      className={`mx-auto flex w-full flex-col items-center ${
        isCompare ? 'gap-4' : compact ? 'gap-8' : 'gap-10 sm:gap-12'
      } ${className}`}
    >
      {showHeader && !isCompare && (
        <div className="max-w-xl space-y-3 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-white/40">Pricing</p>
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
            Simple plans. Start free.
          </h2>
          <p className="text-sm text-white/45">
            Upgrade when you need longer videos, bigger uploads, or no watermark.
          </p>
        </div>
      )}

      <div
        className={`grid w-full gap-4 ${
          isCompare
            ? 'grid-cols-1 sm:grid-cols-3'
            : compact
              ? 'grid-cols-1 lg:grid-cols-3'
              : 'grid-cols-1 md:grid-cols-3 md:gap-5'
        }`}
      >
        {tiers.map((tier) => cardShell(tier))}
      </div>

      {!compact && !isCompare && variant === 'landing' && (
        <p className="max-w-md text-center text-xs text-white/40">
          {FINAL_BOSS_LABEL} is {PLAN_PRICES.founder.amount} one-time
          {PLAN_PRICES.founder.was && ` (was ${PLAN_PRICES.founder.was})`} — includes a golden verified tick.
        </p>
      )}
    </div>
  );
}

export function PricingPageFooter() {
  return (
    <p className="text-center text-sm text-white/50">
      Questions or billing issues?{' '}
      <Link href={`mailto:${SUPPORT_EMAIL}`} className="text-white/70 transition-colors hover:text-white">
        {SUPPORT_EMAIL}
      </Link>
    </p>
  );
}
