import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import { getDodoClient } from '@/lib/billing/dodo-client';
import { applyProSubscription, downgradeToFree } from '@/lib/billing/webhook-handler';
import { getEffectiveTier } from '@/lib/plans';
import { SUPPORT_EMAIL } from '@/lib/plan-marketing';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const profile = await getUserProfile(user.id);
    const tier = getEffectiveTier({
      plan: profile?.user?.plan,
      planStatus: profile?.user?.planStatus,
      planExpiresAt: profile?.user?.planExpiresAt,
      isFounder: profile?.user?.isFounder,
    });

    if (tier === 'founder') {
      return NextResponse.json(
        { error: 'Seenly Final boss! is a lifetime plan and cannot be cancelled.' },
        { status: 400 }
      );
    }

    if (tier !== 'pro') {
      return NextResponse.json({ error: 'No active subscription to cancel.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const immediate = body?.immediate === true;

    const subscriptionId = profile?.user?.dodoSubscriptionId;
    if (!subscriptionId) {
      return NextResponse.json(
        {
          error: `We could not find your subscription. Contact ${SUPPORT_EMAIL} and we will help.`,
        },
        { status: 400 }
      );
    }

    const client = getDodoClient();

    if (immediate) {
      await client.subscriptions.update(subscriptionId, { status: 'cancelled' });
      await downgradeToFree(user.id);
      return NextResponse.json({
        success: true,
        message: 'You have been downgraded to Free. Pro features are no longer active.',
      });
    }

    await client.subscriptions.update(subscriptionId, { cancel_at_next_billing_date: true });
    await applyProSubscription(user.id, {
      subscriptionId,
      customerId: profile?.user?.dodoCustomerId,
      expiresAt: profile?.user?.planExpiresAt ? new Date(profile.user.planExpiresAt) : null,
      status: 'cancelled',
    });

    const expiresLabel = profile?.user?.planExpiresAt
      ? new Date(profile.user.planExpiresAt).toLocaleDateString()
      : 'the end of your billing period';

    return NextResponse.json({
      success: true,
      message: `Subscription cancelled. You keep Pro until ${expiresLabel}.`,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: `Something went wrong. Contact ${SUPPORT_EMAIL} if this keeps happening.` },
      { status: 500 }
    );
  }
}
