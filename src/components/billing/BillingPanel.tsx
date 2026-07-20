'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import PricingTierGrid from '@/components/billing/PricingTierGrid';
import {
  getEffectiveTier,
  getEntitlements,
  getTrialDaysRemaining,
  isTrialing,
  type BillingUserFields,
} from '@/lib/plans';
import { FINAL_BOSS_LABEL, PLAN_PRICES, SUPPORT_EMAIL } from '@/lib/plan-marketing';

interface BillingUser extends BillingUserFields {
  email?: string;
  dodoSubscriptionId?: string | null;
  dodoCustomerId?: string | null;
  planStatus?: string | null;
  planExpiresAt?: Date | string | null;
}

interface BillingPanelProps {
  user: BillingUser;
}

interface PaymentRow {
  id: string;
  planLabel: string;
  amount: string;
  paidAt: string;
}

const cardClass = 'rounded-2xl border border-white/[0.08] bg-white/[0.02]';

export default function BillingPanel({ user }: BillingPanelProps) {
  const [loadingPlan, setLoadingPlan] = useState<'pro' | 'founder' | null>(null);
  const [billingAction, setBillingAction] = useState<'cancel' | 'downgrade' | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const tier = getEffectiveTier(user);
  const entitlements = getEntitlements(user);
  const trialing = isTrialing(user);
  const trialDays = getTrialDaysRemaining(user);
  const isPaidPro = tier === 'pro' && !trialing;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/billing/history', { credentials: 'same-origin' });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && Array.isArray(data.payments)) {
          setPayments(data.payments);
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = async (plan: 'pro' | 'founder') => {
    setLoadingPlan(plan);
    setStatusMessage(null);
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

  const runBillingAction = async (immediate: boolean) => {
    const action = immediate ? 'downgrade' : 'cancel';
    const confirmMsg = immediate
      ? 'End Pro now? Your profile will become private until you subscribe again.'
      : 'Cancel renewal? You keep Pro until the end of your current billing period.';
    if (!window.confirm(confirmMsg)) return;

    setBillingAction(action);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ immediate }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Request failed.');
      }
      setStatusMessage(typeof data.message === 'string' ? data.message : 'Updated.');
      if (immediate) window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Request failed.');
    } finally {
      setBillingAction(null);
    }
  };

  const expiresLabel = user.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString() : null;

  return (
    <div className="space-y-6">
      <div className={`${cardClass} px-5 py-5 sm:px-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/40">
              Current plan
            </span>
            <p className="mt-2 text-base font-semibold tracking-tight text-white">{entitlements.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              {tier === 'free' &&
                'Trial ended. Subscribe to Pro to make your profile public again.'}
              {trialing &&
                `Free Pro trial · ${trialDays ?? 0} day${trialDays === 1 ? '' : 's'} left${
                  expiresLabel ? ` · ends ${expiresLabel}` : ''
                }`}
              {isPaidPro &&
                (user.planStatus === 'cancelled' && expiresLabel
                  ? `Cancels on ${expiresLabel} · access until then`
                  : 'Active · renews monthly')}
              {tier === 'founder' && 'Lifetime access · Final boss badge enabled'}
            </p>
          </div>

          {(tier === 'free' || trialing) && (
            <button
              type="button"
              disabled={loadingPlan === 'pro'}
              onClick={() => startCheckout('pro')}
              className="shrink-0 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] hover:bg-zinc-200 disabled:opacity-50"
            >
              {loadingPlan === 'pro' ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                </span>
              ) : (
                `Subscribe to Pro · ${PLAN_PRICES.pro.amount}${PLAN_PRICES.pro.period}`
              )}
            </button>
          )}

          {isPaidPro && (
            <button
              type="button"
              disabled={loadingPlan === 'founder'}
              onClick={() => startCheckout('founder')}
              className="shrink-0 text-sm font-medium text-white/60 transition-colors hover:text-white disabled:opacity-50"
            >
              {loadingPlan === 'founder' ? 'Starting…' : `${FINAL_BOSS_LABEL} · ${PLAN_PRICES.founder.amount}`}
            </button>
          )}
        </div>

        {statusMessage && (
          <p className="mt-4 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/55">
            {statusMessage}
          </p>
        )}
      </div>

      <div className={`${cardClass} divide-y divide-white/[0.06]`}>
          <div className="px-5 py-4 sm:px-6">
            <p className="text-sm font-semibold tracking-tight text-white">Manage billing</p>
            <p className="mt-1 text-xs text-white/45">Subscription and payment history.</p>
          </div>

          {isPaidPro && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-sm font-medium text-white">Cancel subscription</p>
                  <p className="mt-0.5 text-xs text-white/45">Stop renewal at the end of your billing period.</p>
                </div>
                <button
                  type="button"
                  disabled={billingAction !== null}
                  onClick={() => runBillingAction(false)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {billingAction === 'cancel' ? 'Cancelling…' : 'Cancel'}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
                <div>
                  <p className="text-sm font-medium text-white">End Pro now</p>
                  <p className="mt-0.5 text-xs text-white/45">
                    Profile becomes private until you subscribe again.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={billingAction !== null}
                  onClick={() => runBillingAction(true)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {billingAction === 'downgrade' ? 'Ending…' : 'End now'}
                </button>
              </div>
            </>
          )}

          {tier === 'founder' && (
            <div className="px-5 py-4 sm:px-6">
              <p className="text-sm text-white/55">
                {FINAL_BOSS_LABEL} is lifetime — no cancellation needed. You&apos;re set forever.
              </p>
            </div>
          )}

          <div className="px-5 py-4 sm:px-6">
            <p className="text-sm font-medium text-white">Payment history</p>
            {historyLoading ? (
              <p className="mt-3 text-xs text-white/40">Loading…</p>
            ) : payments.length === 0 ? (
              <p className="mt-3 text-xs text-white/40">No payments recorded yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs"
                  >
                    <div className="min-w-0 text-left">
                      <p className="font-medium text-white/75">{payment.planLabel}</p>
                      <p className="text-white/40">{new Date(payment.paidAt).toLocaleDateString()}</p>
                    </div>
                    <span className="shrink-0 font-medium text-white/60">{payment.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-5 py-4 sm:px-6">
            <p className="text-xs leading-relaxed text-white/40">
              Billing issue or bug?{' '}
              <Link href={`mailto:${SUPPORT_EMAIL}`} className="text-white/60 transition-colors hover:text-white/85">
                {SUPPORT_EMAIL}
              </Link>
            </p>
          </div>
        </div>

      <div className={`${cardClass} px-4 py-4 sm:px-5 sm:py-5`}>
        <p className="mb-4 text-sm font-medium text-white">Compare plans</p>
        <PricingTierGrid
          variant="checkout"
          layout="compare"
          showHeader={false}
          currentTier={tier}
          isTrialing={trialing}
          isSignedIn
        />
      </div>
    </div>
  );
}
