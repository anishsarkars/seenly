import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import { getDodoClient, getDodoProductIds, getAppBaseUrl } from '@/lib/billing/dodo-client';
import { getEffectiveTier } from '@/lib/plans';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in to upgrade.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const plan = body?.plan;

    if (plan !== 'pro' && plan !== 'founder') {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
    }

    const profile = await getUserProfile(user.id);
    const currentTier = getEffectiveTier({
      plan: profile?.user?.plan,
      planStatus: profile?.user?.planStatus,
      planExpiresAt: profile?.user?.planExpiresAt,
      isFounder: profile?.user?.isFounder,
    });

    if (plan === 'founder' && currentTier === 'founder') {
      return NextResponse.json({ error: 'You already have Founder access.' }, { status: 400 });
    }

    if (plan === 'pro' && (currentTier === 'pro' || currentTier === 'founder')) {
      return NextResponse.json({ error: 'You already have an active paid plan.' }, { status: 400 });
    }

    const { pro, founder } = getDodoProductIds();
    const productId = plan === 'pro' ? pro : founder;
    const client = getDodoClient();
    const baseUrl = getAppBaseUrl();

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: {
        email: user.email || profile?.user?.email || '',
        name: profile?.user?.fullName || profile?.user?.username || undefined,
      },
      metadata: {
        seenly_user_id: user.id,
        seenly_plan: plan,
      },
      return_url: `${baseUrl}/dashboard?tab=settings&billing=success&plan=${plan}`,
    });

    if (!session.checkout_url) {
      return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
    }

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Checkout failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
