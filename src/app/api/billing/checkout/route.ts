import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserProfile } from '@/db/actions';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getDodoClient, getDodoProductIds, getAppBaseUrl } from '@/lib/billing/dodo-client';
import { ensureBillingSchema } from '@/lib/billing/webhook-handler';
import { getEffectiveTier } from '@/lib/plans';

function formatCheckoutError(error: unknown): { message: string; status: number } {
  const raw = error instanceof Error ? error.message : String(error);

  if (raw.includes('401') || raw.toLowerCase().includes('unauthorized')) {
    const env = process.env.DODO_PAYMENTS_ENV === 'test_mode' ? 'test_mode' : 'live_mode';
    const hint =
      env === 'live_mode'
        ? 'Your key may be a Test Mode key. In Vercel set DODO_PAYMENTS_ENV=test_mode, or copy your Live API key from Dodo Dashboard (toggle off Test Mode → Developer → API Keys).'
        : 'Copy your Test Mode API key from Dodo Dashboard (Test Mode ON → Developer → API Keys) and set DODO_PAYMENTS_ENV=test_mode.';
    return {
      message: `Dodo Payments rejected the API key (currently using ${env}). ${hint}`,
      status: 502,
    };
  }

  if (raw.includes('DODO_PAYMENTS_API_KEY')) {
    return { message: 'Payment API key is missing on the server. Add DODO_PAYMENTS_API_KEY in Vercel.', status: 503 };
  }

  if (raw.includes('product IDs')) {
    return { message: 'Payment product IDs are missing on the server. Add DODO_PRO_PRODUCT_ID and DODO_FOUNDER_PRODUCT_ID in Vercel.', status: 503 };
  }

  return { message: 'Could not start checkout. Please try again in a moment.', status: 500 };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in to upgrade your plan.', code: 'auth_required' },
        { status: 401 }
      );
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
      return NextResponse.json({ error: 'You already have Seenly Final boss! access.' }, { status: 400 });
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
      return_url: `${baseUrl}/dashboard?tab=settings&billing=return&plan=${plan}`,
      cancel_url: `${baseUrl}/dashboard?tab=settings&billing=cancelled&plan=${plan}`,
    });

    if (!session.checkout_url) {
      return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
    }

    const sessionId =
      typeof session.session_id === 'string'
        ? session.session_id
        : null;

    if (sessionId && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-supabase')) {
      await ensureBillingSchema();
      await db
        .update(users)
        .set({
          pendingCheckoutPlan: plan,
          dodoCheckoutSessionId: sessionId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({ checkoutUrl: session.checkout_url });
  } catch (error) {
    console.error('Checkout error:', error);
    const { message, status } = formatCheckoutError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
