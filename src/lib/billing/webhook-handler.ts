import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getDodoProductIds } from '@/lib/billing/dodo-client';

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
    sql`CREATE TABLE IF NOT EXISTS billing_webhook_events (
      id varchar(128) PRIMARY KEY,
      event_type varchar(64) NOT NULL,
      processed_at timestamp DEFAULT now() NOT NULL
    )`,
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

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readMetadataUserId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== 'object') return null;
  const userId = (metadata as Record<string, unknown>).seenly_user_id;
  return typeof userId === 'string' && userId.length > 0 ? userId : null;
}

async function findUserId({
  metadata,
  customerId,
}: {
  metadata?: unknown;
  customerId?: string | null;
}): Promise<string | null> {
  const fromMetadata = readMetadataUserId(metadata);
  if (fromMetadata) return fromMetadata;

  if (!customerId || !isDbAvailable()) return null;

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.dodoCustomerId, customerId))
    .limit(1);

  return row?.id ?? null;
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

  const [existing] = await db.select({ plan: users.plan, isFounder: users.isFounder }).from(users).where(eq(users.id, userId)).limit(1);
  if (existing?.isFounder || existing?.plan === 'founder') return;

  await db
    .update(users)
    .set({
      plan: 'pro',
      planStatus: status,
      planExpiresAt: expiresAt,
      ...(subscriptionId ? { dodoSubscriptionId: subscriptionId } : {}),
      ...(customerId ? { dodoCustomerId: customerId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function downgradeToFree(userId: string) {
  if (!isDbAvailable()) return;
  await ensureBillingSchema();

  const [existing] = await db.select({ isFounder: users.isFounder, plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1);
  if (existing?.isFounder || existing?.plan === 'founder') return;

  await db
    .update(users)
    .set({
      plan: 'free',
      planStatus: null,
      planExpiresAt: null,
      dodoSubscriptionId: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function handleDodoWebhookEvent(event: {
  type?: string;
  data?: unknown;
}) {
  const type = event.type;
  const data = (event.data && typeof event.data === 'object' ? event.data : {}) as Record<string, unknown>;
  const { pro, founder } = getDodoProductIds();

  const metadata = data.metadata;
  const customerField = data.customer;
  const customerFromNested =
    customerField && typeof customerField === 'object'
      ? (customerField as Record<string, unknown>).customer_id
      : null;
  const customerId =
    typeof data.customer_id === 'string'
      ? data.customer_id
      : typeof customerFromNested === 'string'
        ? customerFromNested
        : null;
  const userId = await findUserId({ metadata, customerId });
  if (!userId) {
    console.warn('Dodo webhook: could not resolve Seenly user', type);
    return;
  }

  const productId =
    typeof data.product_id === 'string'
      ? data.product_id
      : null;

  const cartProductIds = Array.isArray(data.product_cart)
    ? data.product_cart
        .map((item) => (item && typeof item === 'object' ? (item as { product_id?: string }).product_id : null))
        .filter((id): id is string => typeof id === 'string')
    : [];

  const metadataPlan =
    metadata && typeof metadata === 'object'
      ? (metadata as Record<string, unknown>).seenly_plan
      : null;

  const subscriptionId = typeof data.subscription_id === 'string' ? data.subscription_id : null;
  const nextBilling = parseDate(data.next_billing_date);

  switch (type) {
    case 'payment.succeeded': {
      const isFounderPayment =
        productId === founder ||
        cartProductIds.includes(founder) ||
        metadataPlan === 'founder';

      if (isFounderPayment && !subscriptionId) {
        await applyFounderPlan(userId, customerId);
      }
      break;
    }
    case 'subscription.active':
    case 'subscription.renewed': {
      if (productId === pro || !productId) {
        await applyProSubscription(userId, {
          subscriptionId,
          customerId,
          expiresAt: nextBilling,
          status: 'active',
        });
      }
      break;
    }
    case 'subscription.on_hold': {
      await applyProSubscription(userId, {
        subscriptionId,
        customerId,
        expiresAt: nextBilling,
        status: 'on_hold',
      });
      break;
    }
    case 'subscription.cancelled': {
      await applyProSubscription(userId, {
        subscriptionId,
        customerId,
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
