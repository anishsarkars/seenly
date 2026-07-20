import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getDodoProductIds } from '@/lib/billing/dodo-client';
import { parseDodoEventData, parseDate } from '@/lib/billing/parse-webhook-data';
import { PLAN_PRICES } from '@/lib/plan-marketing';
import { getEffectiveTier, isTrialing, trialEndsAtFromNow, TRIAL_DAYS } from '@/lib/plans';

function isDbAvailable() {
  return !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-supabase');
}

export async function ensureBillingSchema() {
  if (!isDbAvailable()) return;

  const statements = [
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan varchar(20) DEFAULT 'free' NOT NULL`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_status varchar(20)`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at timestamp`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founder boolean DEFAULT false NOT NULL`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dodo_customer_id varchar(64)`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dodo_subscription_id varchar(64)`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS dodo_checkout_session_id varchar(64)`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_checkout_plan varchar(20)`,
    sql`CREATE TABLE IF NOT EXISTS billing_webhook_events (
      id varchar(128) PRIMARY KEY,
      event_type varchar(64) NOT NULL,
      processed_at timestamp DEFAULT now() NOT NULL
    )`,
    sql`CREATE TABLE IF NOT EXISTS billing_payments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan varchar(20) NOT NULL,
      amount_label varchar(32) NOT NULL,
      dodo_payment_id varchar(128) UNIQUE,
      paid_at timestamp DEFAULT now() NOT NULL
    )`,
    sql`CREATE INDEX IF NOT EXISTS billing_payments_user_id_idx ON billing_payments(user_id)`,
  ];

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (error) {
      console.warn('Billing schema ensure step skipped:', error);
    }
  }
}

export async function hasProcessedWebhook(eventId: string) {
  if (!isDbAvailable()) return false;
  await ensureBillingSchema();

  try {
    const rows = await db.execute<{ id: string }>(
      sql`SELECT id FROM billing_webhook_events WHERE id = ${eventId} LIMIT 1`
    );
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return false;
  }
}

export async function markWebhookProcessed(eventId: string, eventType: string) {
  if (!isDbAvailable()) return;
  await ensureBillingSchema();

  await db.execute(
    sql`INSERT INTO billing_webhook_events (id, event_type) VALUES (${eventId}, ${eventType}) ON CONFLICT (id) DO NOTHING`
  );
}

function readMetadataUserId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const userId = (metadata as Record<string, unknown>).seenly_user_id;
  return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

async function findUserId({
  metadata,
  customerId,
  metadataUserId,
}: {
  metadata?: unknown;
  customerId?: string | null;
  metadataUserId?: string | null;
}): Promise<string | null> {
  const fromMetadata = metadataUserId ?? readMetadataUserId(metadata);
  if (fromMetadata) return fromMetadata;

  if (!customerId || !isDbAvailable()) return null;

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.dodoCustomerId, customerId))
    .limit(1);

  return row?.id ?? null;
}

export async function recordBillingPayment(
  userId: string,
  {
    plan,
    amountLabel,
    paymentId,
  }: {
    plan: 'pro' | 'founder';
    amountLabel: string;
    paymentId?: string | null;
  }
) {
  if (!isDbAvailable()) return;
  await ensureBillingSchema();

  try {
    await db.execute(
      sql`INSERT INTO billing_payments (user_id, plan, amount_label, dodo_payment_id)
          VALUES (${userId}, ${plan}, ${amountLabel}, ${paymentId ?? null})
          ON CONFLICT (dodo_payment_id) DO NOTHING`
    );
  } catch (error) {
    console.warn('Failed to record billing payment:', error);
  }
}

export async function clearPendingCheckout(userId: string) {
  if (!isDbAvailable()) return;
  await ensureBillingSchema();
  await db
    .update(users)
    .set({ pendingCheckoutPlan: null, dodoCheckoutSessionId: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function applyFounderPlan(userId: string, customerId?: string | null) {
  if (!isDbAvailable()) return;
  await ensureBillingSchema();

  await db
    .update(users)
    .set({
      plan: 'founder',
      planStatus: 'active',
      planExpiresAt: null,
      isFounder: true,
      pendingCheckoutPlan: null,
      ...(customerId ? { dodoCustomerId: customerId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function applyProSubscription(
  userId: string,
  {
    subscriptionId,
    customerId,
    expiresAt,
    status = 'active',
  }: {
    subscriptionId?: string | null;
    customerId?: string | null;
    expiresAt?: Date | null;
    status?: 'active' | 'on_hold' | 'cancelled';
  }
) {
  if (!isDbAvailable()) return;
  await ensureBillingSchema();

  const [existing] = await db
    .select({ plan: users.plan, isFounder: users.isFounder })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing?.isFounder || existing?.plan === 'founder') return;

  await db
    .update(users)
    .set({
      plan: 'pro',
      planStatus: status,
      planExpiresAt: expiresAt,
      pendingCheckoutPlan: null,
      ...(subscriptionId ? { dodoSubscriptionId: subscriptionId } : {}),
      ...(customerId ? { dodoCustomerId: customerId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/** End paid access — profile becomes private until they subscribe again. */
export async function downgradeToFree(userId: string) {
  if (!isDbAvailable()) return;
  await ensureBillingSchema();

  const [existing] = await db
    .select({ isFounder: users.isFounder, plan: users.plan })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing?.isFounder || existing?.plan === 'founder') return;

  await db
    .update(users)
    .set({
      plan: 'free',
      planStatus: 'expired',
      planExpiresAt: null,
      dodoSubscriptionId: null,
      pendingCheckoutPlan: null,
      isPublic: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/** Grant a fresh 14-day Pro trial (new signups + legacy free users once). */
export async function startTrial(userId: string, days = TRIAL_DAYS) {
  if (!isDbAvailable()) return;
  await ensureBillingSchema();

  const [existing] = await db
    .select({
      isFounder: users.isFounder,
      plan: users.plan,
      planStatus: users.planStatus,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!existing) return;
  if (existing.isFounder || existing.plan === 'founder') return;
  if (existing.plan === 'pro' && existing.planStatus === 'active') return;
  if (existing.planStatus === 'trialing') return;
  if (existing.planStatus === 'expired') return;

  await db
    .update(users)
    .set({
      plan: 'pro',
      planStatus: 'trialing',
      planExpiresAt: trialEndsAtFromNow(days),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Lazily start trials for legacy free users and expire finished trials.
 * Call on profile/billing reads so access stays in sync without a cron.
 */
export async function ensureUserTrial(userId: string) {
  if (!isDbAvailable()) return null;
  await ensureBillingSchema();

  const [row] = await db
    .select({
      plan: users.plan,
      planStatus: users.planStatus,
      planExpiresAt: users.planExpiresAt,
      isFounder: users.isFounder,
      dodoCustomerId: users.dodoCustomerId,
      dodoSubscriptionId: users.dodoSubscriptionId,
      pendingCheckoutPlan: users.pendingCheckoutPlan,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return null;

  if (row.isFounder || row.plan === 'founder') {
    return { ...row, tier: getEffectiveTier(row) };
  }

  if (row.plan === 'pro' && (row.planStatus === 'active' || row.planStatus === 'on_hold')) {
    return { ...row, tier: getEffectiveTier(row) };
  }

  if (row.plan === 'pro' && row.planStatus === 'cancelled' && row.planExpiresAt && new Date(row.planExpiresAt) > new Date()) {
    return { ...row, tier: getEffectiveTier(row) };
  }

  // Trial still valid
  if (isTrialing(row)) {
    return { ...row, tier: getEffectiveTier(row) };
  }

  // Trial window passed → expire
  if (row.planStatus === 'trialing') {
    await downgradeToFree(userId);
    const [updated] = await db
      .select({
        plan: users.plan,
        planStatus: users.planStatus,
        planExpiresAt: users.planExpiresAt,
        isFounder: users.isFounder,
        dodoCustomerId: users.dodoCustomerId,
        dodoSubscriptionId: users.dodoSubscriptionId,
        pendingCheckoutPlan: users.pendingCheckoutPlan,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return updated ? { ...updated, tier: getEffectiveTier(updated) } : null;
  }

  // Legacy permanent free → one-time 14-day Pro trial
  if (row.plan === 'free' && row.planStatus !== 'expired') {
    await startTrial(userId);
    const [updated] = await db
      .select({
        plan: users.plan,
        planStatus: users.planStatus,
        planExpiresAt: users.planExpiresAt,
        isFounder: users.isFounder,
        dodoCustomerId: users.dodoCustomerId,
        dodoSubscriptionId: users.dodoSubscriptionId,
        pendingCheckoutPlan: users.pendingCheckoutPlan,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return updated ? { ...updated, tier: getEffectiveTier(updated) } : null;
  }

  return { ...row, tier: getEffectiveTier(row) };
}

function resolvePaidPlan({
  productId,
  cartProductIds,
  metadataPlan,
  proProductId,
  founderProductId,
}: {
  productId: string | null;
  cartProductIds: string[];
  metadataPlan: string | null;
  proProductId: string;
  founderProductId: string;
}): 'pro' | 'founder' | null {
  if (
    productId === founderProductId ||
    cartProductIds.includes(founderProductId) ||
    metadataPlan === 'founder'
  ) {
    return 'founder';
  }
  if (productId === proProductId || cartProductIds.includes(proProductId) || metadataPlan === 'pro') {
    return 'pro';
  }
  return null;
}

/** Activate plan on the user row — used by webhooks and post-checkout sync. */
export async function activatePaidPlan(
  userId: string,
  plan: 'pro' | 'founder',
  {
    customerId,
    subscriptionId,
    expiresAt,
    paymentId,
  }: {
    customerId?: string | null;
    subscriptionId?: string | null;
    expiresAt?: Date | null;
    paymentId?: string | null;
  }
) {
  if (plan === 'founder') {
    await applyFounderPlan(userId, customerId);
    await recordBillingPayment(userId, {
      plan: 'founder',
      amountLabel: PLAN_PRICES.founder.amount,
      paymentId,
    });
    return;
  }

  await applyProSubscription(userId, {
    subscriptionId,
    customerId,
    expiresAt,
    status: 'active',
  });
  await recordBillingPayment(userId, {
    plan: 'pro',
    amountLabel: `${PLAN_PRICES.pro.amount}${PLAN_PRICES.pro.period}`,
    paymentId,
  });
}

export async function handleDodoWebhookEvent(event: {
  type?: string;
  data?: unknown;
}) {
  const type = event.type;
  const data = (event.data && typeof event.data === 'object' ? event.data : {}) as Record<string, unknown>;
  const { pro, founder } = getDodoProductIds();
  const parsed = parseDodoEventData(data);

  const userId = await findUserId({
    metadata: parsed.metadata,
    customerId: parsed.customerId,
    metadataUserId: parsed.metadataUserId,
  });
  if (!userId) {
    console.warn('Dodo webhook: could not resolve Seenly user', type);
    return;
  }

  const paidPlan = resolvePaidPlan({
    productId: parsed.productId,
    cartProductIds: parsed.cartProductIds,
    metadataPlan: parsed.metadataPlan,
    proProductId: pro,
    founderProductId: founder,
  });

  const nextBilling = parseDate(parsed.nextBilling);

  switch (type) {
    case 'payment.succeeded': {
      if (paidPlan === 'founder') {
        await activatePaidPlan(userId, 'founder', {
          customerId: parsed.customerId,
          paymentId: parsed.paymentId,
        });
      } else if (paidPlan === 'pro' || parsed.subscriptionId) {
        await activatePaidPlan(userId, 'pro', {
          customerId: parsed.customerId,
          subscriptionId: parsed.subscriptionId,
          expiresAt: nextBilling,
          paymentId: parsed.paymentId,
        });
      }
      break;
    }
    case 'subscription.active':
    case 'subscription.renewed': {
      if (paidPlan === 'founder') {
        await activatePaidPlan(userId, 'founder', {
          customerId: parsed.customerId,
          paymentId: parsed.paymentId,
        });
      } else {
        await applyProSubscription(userId, {
          subscriptionId: parsed.subscriptionId,
          customerId: parsed.customerId,
          expiresAt: nextBilling,
          status: 'active',
        });
      }
      break;
    }
    case 'subscription.on_hold': {
      await applyProSubscription(userId, {
        subscriptionId: parsed.subscriptionId,
        customerId: parsed.customerId,
        expiresAt: nextBilling,
        status: 'on_hold',
      });
      break;
    }
    case 'subscription.cancelled': {
      await applyProSubscription(userId, {
        subscriptionId: parsed.subscriptionId,
        customerId: parsed.customerId,
        expiresAt: nextBilling,
        status: 'cancelled',
      });
      break;
    }
    case 'subscription.expired':
    case 'subscription.failed': {
      await downgradeToFree(userId);
      break;
    }
    default:
      break;
  }
}

export async function getUserBillingState(userId: string) {
  return ensureUserTrial(userId);
}
