import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import { getDodoClient } from '@/lib/billing/dodo-client';
import {
  activatePaidPlan,
  ensureBillingSchema,
  getUserBillingState,
} from '@/lib/billing/webhook-handler';
import { getEffectiveTier } from '@/lib/plans';

type PaidPlan = 'pro' | 'founder';

async function verifyCheckoutPayment({
  userId,
  plan,
  paymentId,
  subscriptionId,
  status,
  checkoutSessionId,
}: {
  userId: string;
  plan: PaidPlan;
  paymentId?: string | null;
  subscriptionId?: string | null;
  status?: string | null;
  checkoutSessionId?: string | null;
}): Promise<{ verified: boolean; customerId?: string | null; subscriptionId?: string | null }> {
  const client = getDodoClient();

  if (checkoutSessionId) {
    try {
      const session = await client.checkoutSessions.retrieve(checkoutSessionId);
      const paymentStatus = session.payment_status;
      if (paymentStatus === 'succeeded') {
        return {
          verified: true,
          subscriptionId: subscriptionId ?? null,
        };
      }
    } catch (error) {
      console.warn('Checkout session verify failed:', error);
    }
  }

  if (subscriptionId && plan === 'pro') {
    try {
      const subscription = await client.subscriptions.retrieve(subscriptionId);
      const subStatus = (subscription as { status?: string }).status;
      const customerId = (subscription as { customer_id?: string }).customer_id;
      if (subStatus === 'active' || subStatus === 'on_hold' || subStatus === 'cancelled') {
        return { verified: true, customerId, subscriptionId };
      }
    } catch (error) {
      console.warn('Subscription verify failed:', error);
    }
  }

  if (paymentId && status === 'succeeded') {
    try {
      const paymentsApi = (client as { payments?: { retrieve: (id: string) => Promise<unknown> } }).payments;
      if (paymentsApi) {
        const payment = await paymentsApi.retrieve(paymentId);
        const payStatus = (payment as { status?: string }).status;
        const customerId = (payment as { customer_id?: string }).customer_id;
        const metadata = (payment as { metadata?: Record<string, string> }).metadata;
        if (
          payStatus === 'succeeded' &&
          (!metadata?.seenly_user_id || metadata.seenly_user_id === userId)
        ) {
          return { verified: true, customerId };
        }
      }
    } catch (error) {
      console.warn('Payment verify failed:', error);
    }
  }

  return { verified: false };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = body?.plan as PaidPlan | undefined;
    if (plan !== 'pro' && plan !== 'founder') {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }

    await ensureBillingSchema();
    const billing = await getUserBillingState(user.id);
    const currentTier = billing?.tier ?? getEffectiveTier({});

    if (plan === 'founder' && currentTier === 'founder') {
      const profile = await getUserProfile(user.id);
      return NextResponse.json({ success: true, tier: 'founder', profile });
    }
    if (plan === 'pro' && (currentTier === 'pro' || currentTier === 'founder')) {
      const profile = await getUserProfile(user.id);
      return NextResponse.json({ success: true, tier: currentTier, profile });
    }

    const paymentId = typeof body?.paymentId === 'string' ? body.paymentId : null;
    const subscriptionId = typeof body?.subscriptionId === 'string' ? body.subscriptionId : null;
    const status = typeof body?.status === 'string' ? body.status : null;

    const profile = await getUserProfile(user.id);
    const checkoutSessionId =
      typeof profile?.user?.dodoCheckoutSessionId === 'string'
        ? profile.user.dodoCheckoutSessionId
        : null;

    const verification = await verifyCheckoutPayment({
      userId: user.id,
      plan,
      paymentId,
      subscriptionId,
      status,
      checkoutSessionId,
    });

    if (!verification.verified) {
      return NextResponse.json(
        {
          error: 'Payment not confirmed yet. Your plan will apply automatically — refresh in a moment.',
          pending: true,
        },
        { status: 202 }
      );
    }

    await activatePaidPlan(user.id, plan, {
      customerId: verification.customerId ?? profile?.user?.dodoCustomerId,
      subscriptionId: verification.subscriptionId ?? subscriptionId,
      paymentId,
    });

    const updatedProfile = await getUserProfile(user.id);
    const updatedTier = getEffectiveTier({
      plan: updatedProfile?.user?.plan,
      planStatus: updatedProfile?.user?.planStatus,
      planExpiresAt: updatedProfile?.user?.planExpiresAt,
      isFounder: updatedProfile?.user?.isFounder,
    });

    return NextResponse.json({
      success: true,
      tier: updatedTier,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Billing sync error:', error);
    return NextResponse.json({ error: 'Could not sync plan. Try refreshing shortly.' }, { status: 500 });
  }
}
