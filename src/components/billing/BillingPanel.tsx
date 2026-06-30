'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { getEffectiveTier, getEntitlements, type BillingUserFields } from '@/lib/plans';
import { PLAN_PRICES } from '@/lib/plan-marketing';
import { btnPrimary, btnSecondary, muted, panel } from '@/lib/platform-ui';

interface BillingPanelProps {
  user: BillingUserFields & { email?: string };
}

export default function BillingPanel({ user }: BillingPanelProps) {
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'founder' | null>(null);

  const tier = getEffectiveTier(user);
  const entitlements = getEntitlements(user);

  const startCheckout = async (plan: 'pro' | 'founder') => {
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
          window.location.href = `/login?next=${encodeURIComponent('/dashboard?tab=settings')}`;
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

  return (
    <div className={`${panel} px-5 py-4`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/35">Current plan</p>
          <p className="mt-1 text-base font-semibold text-white">{entitlements.label}</p>
          <p className={`${muted} mt-1 text-xs`}>
            {tier === 'free' && 'Upgrade for longer videos, bigger uploads, and no watermark.'}
            {tier === 'pro' && 'Active · renews monthly'}
            {tier === 'founder' && 'Lifetime access · Founder badge enabled'}
          </p>
        </div>

        {tier === 'free' && (
          <button
            type="button"
            disabled={loadingPlan === 'pro'}
            onClick={() => startCheckout('pro')}
            className={`${btnPrimary} shrink-0`}
          >
            {loadingPlan === 'pro' ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Starting…
              </span>
            ) : (
              `Upgrade to Pro · ${PLAN_PRICES.pro.amount}${PLAN_PRICES.pro.period}`
            )}
          </button>
        )}

        {tier === 'pro' && (
          <button
            type="button"
            disabled={loadingPlan === 'founder'}
            onClick={() => startCheckout('founder')}
            className={`${btnSecondary} shrink-0 text-xs`}
          >
            {loadingPlan === 'founder' ? 'Starting…' : `Founder · ${PLAN_PRICES.founder.amount}`}
          </button>
        )}
      </div>

      {tier === 'free' && (
        <p className="mt-3 text-xs text-white/35">
          See all plans on the{' '}
          <Link href="/pricing" className="text-white/55 underline hover:text-white/80">
            pricing page
          </Link>
          .
        </p>
      )}
    </div>
  );
}
