'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PricingCards from '@/components/billing/PricingCards';
import { getEffectiveTier, getEntitlements, type BillingUserFields } from '@/lib/plans';
import { btnSecondary, muted, panel } from '@/lib/platform-ui';

interface BillingPanelProps {
  user: BillingUserFields & { email?: string };
}

export default function BillingPanel({ user }: BillingPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'founder' | null>(null);

  const tier = getEffectiveTier(user);
  const entitlements = getEntitlements(user);
  const billingSuccess = searchParams.get('billing') === 'success';

  const handleUpgrade = async (plan: 'pro' | 'founder') => {
    setLoadingPlan(plan);
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
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      {billingSuccess && (
        <div className={`${panel} border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-sm text-emerald-300/90`}>
          Payment received — your plan will update shortly once confirmed. Refresh if it doesn&apos;t appear in a minute.
          <button type="button" onClick={() => router.replace('/dashboard?tab=settings')} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className={`${panel} px-5 py-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Current plan</p>
            <p className="mt-0.5 text-lg font-semibold text-white">{entitlements.label}</p>
            <p className={`${muted} mt-1`}>
              {tier === 'free' && 'Upgrade for longer videos, more uploads, and no watermark.'}
              {tier === 'pro' && 'Active subscription · renews monthly'}
              {tier === 'founder' && 'Lifetime access · Founder badge enabled'}
            </p>
          </div>
          <Link href="/pricing" className={btnSecondary}>
            Compare plans
          </Link>
        </div>
      </div>

      <PricingCards currentTier={tier} compact onUpgrade={handleUpgrade} loadingPlan={loadingPlan} />
    </div>
  );
}
