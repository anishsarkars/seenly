import { db } from '@/db/index';
import { ensureProfileSchema } from '@/db/ensure-schema';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getEntitlements } from '@/lib/plans';

export async function getUserEntitlements(userId: string) {
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('your-supabase')) {
    return getEntitlements({});
  }

  try {
    await ensureProfileSchema();
    const [row] = await db
      .select({
        plan: users.plan,
        planStatus: users.planStatus,
        planExpiresAt: users.planExpiresAt,
        isFounder: users.isFounder,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return getEntitlements(row ?? {});
  } catch (error) {
    console.error('Failed to load plan entitlements, using free tier:', error);
    return getEntitlements({});
  }
}
