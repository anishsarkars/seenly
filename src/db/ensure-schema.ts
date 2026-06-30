import { sql } from 'drizzle-orm';
import { db } from './index';

let schemaEnsured = false;

function isDbAvailable() {
  return !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-supabase');
}

export async function ensureProfileSchema() {
  if (schemaEnsured || !isDbAvailable()) return;

  const statements = [
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name varchar(120)`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true`,
    sql`UPDATE users SET is_public = true WHERE is_public IS NULL`,
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`,
    sql`UPDATE users SET updated_at = now() WHERE updated_at IS NULL`,
    sql`ALTER TABLE users ALTER COLUMN bio TYPE varchar(500)`,
    sql`CREATE TABLE IF NOT EXISTS profile_views (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      country varchar(100),
      device varchar(50),
      browser varchar(50),
      referrer text,
      created_at timestamp DEFAULT now() NOT NULL
    )`,
    sql`CREATE INDEX IF NOT EXISTS profile_views_profile_id_idx ON profile_views(profile_id)`,
    sql`CREATE INDEX IF NOT EXISTS profile_views_created_at_idx ON profile_views(created_at)`,
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
      console.warn('Schema ensure step skipped:', error);
    }
  }

  schemaEnsured = true;
}
