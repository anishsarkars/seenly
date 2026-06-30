'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Sparkles, Zap } from 'lucide-react';
import { FreeTierIcon, FounderTierIcon, ProTierIcon } from '@/components/billing/pricing-tier-icons';
import { getPlanFeatureList } from '@/lib/plan-features';
import { PLAN_PRICES, FINAL_BOSS_LABEL, SUPPORT_EMAIL } from '@/lib/plan-marketing';
import { type PlanTier } from '@/lib/plans';

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

  const tiers: Array<{
    id: PlanTier;
    label: string;
    tagline: string;
    price: string;
    period?: string;
    wasPrice?: string;
    icon: React.ReactNode;
    accent: 'neutral' | 'emerald' | 'gold';
    launchRibbon?: string;
    popular?: boolean;
    landingHref: string;
    landingLabel: string;
  }> = [
    {
      id: 'free',
      label: 'Free',
      tagline: 'Perfect for getting started.',
      price: '₹0',
      icon: <FreeTierIcon />,
      accent: 'neutral',
      landingHref: '/onboarding',
      landingLabel: 'Get started free',
    },
    {
      id: 'pro',
      label: 'Seenly Pro',
      tagline: 'For serious job seekers & creators.',
      price: PLAN_PRICES.pro.amount,
      period: PLAN_PRICES.pro.period,
      icon: <ProTierIcon />,
      accent: 'emerald',
      popular: true,
      landingHref: '/pricing',
      landingLabel: 'Upgrade to Pro',
    },
    {
      id: 'founder',
      label: FINAL_BOSS_LABEL,
      tagline: 'Pro forever. One payment. No renewals.',
      price: PLAN_PRICES.founder.amount,
      period: ' one-time',
      wasPrice: PLAN_PRICES.founder.was,
      icon: <FounderTierIcon />,
      accent: 'gold',
      launchRibbon: 'Launch offer · save 33%',
      landingHref: '/pricing',
      landingLabel: 'Claim Final boss',
    },
  ];

  const renderCta = (tierId: PlanTier, landingHref: string, landingLabel: string) => {
    const goldBtn =
      'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-[0_0_24px_-4px_rgba(245,158,11,0.5)] transition-transform hover:scale-[1.02] disabled:opacity-50';
    const primaryBtn =
      'inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] hover:bg-zinc-100 disabled:opacity-50';
    const ghostBtn =
      'inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50';

    if (variant === 'landing') {
      if (tierId === 'founder') {
        return (
          <Link href={landingHref} className={goldBtn}>
            <Sparkles className="h-4 w-4" />
            {landingLabel}
          </Link>
        );
      }
      if (tierId === 'pro') {
        return <Link href={landingHref} className={primaryBtn}>{landingLabel}</Link>;
      }
      return <Link href={landingHref} className={ghostBtn}>{landingLabel}</Link>;
    }

    if (tierId === 'free') {
      if (currentTier === 'free') {
        return <p className="text-center text-xs font-medium uppercase tracking-widest text-white/35">Current plan</p>;
      }
      return <p className="text-center text-xs text-white/40">Included with every account</p>;
    }

    if (tierId === 'pro') {
      if (currentTier === 'pro' || currentTier === 'founder') {
        return <p className="text-center text-xs font-semibold uppercase tracking-widest text-emerald-400/80">Active</p>;
      }
      return (
        <button type="button" disabled={loadingPlan === 'pro'} onClick={() => startCheckout('pro')} className={primaryBtn}>
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
      return (
        <p className="text-center text-xs font-semibold text-amber-300/90">
          You&apos;re Final boss — golden tick unlocked
        </p>
      );
    }

    return (
      <button
        type="button"
        disabled={loadingPlan === 'founder'}
        onClick={() => startCheckout('founder')}
        className={currentTier === 'pro' ? ghostBtn : goldBtn}
      >
        {loadingPlan === 'founder' ? (
          'Starting…'
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Get Final boss · {PLAN_PRICES.founder.amount}
          </>
        )}
      </button>
    );
  };

  const cardShell = (tier: (typeof tiers)[number]) => {
    const features = getPlanFeatureList(tier.id);
    const visibleFeatures = compact ? features.slice(0, compact && tier.id === 'pro' ? 5 : 4) : features;
    const isCurrent = variant === 'checkout' && currentTier === tier.id;

    const accentStyles = {
      neutral: {
        card: 'border-white/10 bg-white/[0.03]',
        icon: 'text-white/45',
        check: 'text-white/40',
        glow: '',
      },
      emerald: {
        card: 'border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.08] to-transparent ring-1 ring-emerald-500/15',
        icon: 'text-emerald-400/80',
        check: 'text-emerald-400/90',
        glow: 'shadow-[0_0_40px_-12px_rgba(16,185,129,0.25)]',
      },
      gold: {
        card: 'border-amber-400/35 bg-gradient-to-b from-amber-500/[0.12] via-amber-500/[0.04] to-transparent ring-1 ring-amber-400/20',
        icon: 'text-amber-300/90',
        check: 'text-amber-300/90',
        glow: 'shadow-[0_0_48px_-10px_rgba(245,158,11,0.35)]',
      },
    }[tier.accent];

    return (
      <div
        key={tier.id}
        className={`relative flex h-full flex-col rounded-2xl border p-5 text-left sm:p-6 ${accentStyles.card} ${accentStyles.glow} ${
          isCurrent ? 'ring-2 ring-white/25' : ''
        }`}
      >
        {tier.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-950">
              <Zap className="h-3 w-3" fill="currentColor" />
              Most popular
            </span>
          </div>
        )}

        {tier.launchRibbon && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-lg shadow-amber-500/20">
              <Sparkles className="h-3 w-3" />
              {tier.launchRibbon}
            </span>
          </div>
        )}

        <div className={`mb-4 mt-1 ${accentStyles.icon}`}>{tier.icon}</div>

        <p className="text-sm font-semibold tracking-tight text-white">{tier.label}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/45">{tier.tagline}</p>

        <div className="mt-4 flex flex-wrap items-baseline gap-2">
          {tier.wasPrice && (
            <span className="text-lg font-medium text-white/30 line-through">{tier.wasPrice}</span>
          )}
          <span className="text-3xl font-bold tracking-tight text-white">
            {tier.price}
            {tier.period && (
              <span className="text-sm font-normal text-white/40">{tier.period}</span>
            )}
          </span>
        </div>

        {tier.wasPrice && !compact && (
          <p className="mt-2 text-xs font-medium text-amber-300/80">
            Limited launch pricing — pay once, keep Pro forever
          </p>
        )}

        <ul className={`mt-5 flex-1 space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          {visibleFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-white/60">
              <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${accentStyles.check}`} strokeWidth={2.5} />
              <span className={feature.endsWith(':') ? 'font-medium text-white/75' : ''}>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-2">
          {renderCta(tier.id, tier.landingHref, tier.landingLabel)}
        </div>
      </div>
    );
  };

  return (
    <div className={`mx-auto flex w-full max-w-5xl flex-col items-center ${compact ? 'gap-8' : 'gap-12 sm:gap-14'} ${className}`}>
      {showHeader && (
        <div className="max-w-2xl space-y-4 text-center sm:space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            Pricing
          </span>
          <h2 className="text-2xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
            Start free. Scale when you&apos;re ready.<br />
            <span className="text-white/55">Lock in the launch offer before it&apos;s gone.</span>
          </h2>
        </div>
      )}

      <div
        className={`grid w-full gap-5 ${
          compact ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-3 md:gap-6'
        }`}
      >
        {tiers.map((tier) => cardShell(tier))}
      </div>

      {!compact && (
        <div className="w-full max-w-lg rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/10 px-5 py-4 text-center backdrop-blur-sm">
          <p className="text-sm text-white/55">
            <span className="font-semibold text-amber-200/90">Final boss launch</span>
            {' '}— {PLAN_PRICES.founder.amount} one-time
            {PLAN_PRICES.founder.was && (
              <span className="text-white/35"> (was {PLAN_PRICES.founder.was})</span>
            )}
            . Includes a{' '}
            <span className="font-semibold text-amber-200/80">golden verified tick</span> on your profile.
          </p>
        </div>
      )}
    </div>
  );
}

export function PricingPageFooter() {
  return (
    <p className="text-center text-sm text-white/50">
      Questions or billing issues?{' '}
      <Link href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-white/70 transition-colors hover:text-white">
        {SUPPORT_EMAIL}
      </Link>
    </p>
  );
}
