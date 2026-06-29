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
