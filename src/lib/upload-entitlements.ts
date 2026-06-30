import { getUserBillingState } from '@/lib/billing/webhook-handler';
import { getEntitlements } from '@/lib/plans';

export async function getUserEntitlements(userId: string) {
  try {
    const billing = await getUserBillingState(userId);
    return getEntitlements(billing ?? {});
  } catch (error) {
    console.error('Failed to load plan entitlements, using free tier:', error);
    return getEntitlements({});
  }
}
