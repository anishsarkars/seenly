import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { createClient } from '@/utils/supabase/server';
import { db } from '@/db/index';
import { ensureProfileSchema } from '@/db/ensure-schema';
import { FINAL_BOSS_LABEL } from '@/lib/plan-marketing';

function isDbAvailable() {
  return !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('your-supabase');
}

const PLAN_LABELS: Record<string, string> = {
  pro: 'Seenly Pro',
  founder: FINAL_BOSS_LABEL,
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    if (!isDbAvailable()) {
      return NextResponse.json({ payments: [] });
    }

    await ensureProfileSchema();

    const rows = await db.execute<{
      id: string;
      plan: string;
      amount_label: string;
      paid_at: string;
    }>(
      sql`SELECT id, plan, amount_label, paid_at
          FROM billing_payments
          WHERE user_id = ${user.id}
          ORDER BY paid_at DESC
          LIMIT 20`
    );

    const payments = (Array.isArray(rows) ? rows : []).map((row) => ({
      id: row.id,
      plan: row.plan,
      planLabel: PLAN_LABELS[row.plan] ?? row.plan,
      amount: row.amount_label,
      paidAt: row.paid_at,
    }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Billing history error:', error);
    return NextResponse.json({ payments: [] });
  }
}
