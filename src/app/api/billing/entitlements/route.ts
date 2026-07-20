import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserBillingState } from '@/lib/billing/webhook-handler';
import {
  canPublishPublic,
  getEntitlements,
  getTrialDaysRemaining,
  isTrialing,
} from '@/lib/plans';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
    }

    const billing = await getUserBillingState(user.id);
    const fields = billing ?? {};
    const entitlements = getEntitlements(fields);

    return NextResponse.json({
      tier: entitlements.tier,
      label: entitlements.label,
      plan: billing?.plan ?? 'free',
      planStatus: billing?.planStatus ?? null,
      planExpiresAt: billing?.planExpiresAt ?? null,
      isFounder: billing?.isFounder ?? false,
      isTrialing: isTrialing(fields),
      trialDaysRemaining: getTrialDaysRemaining(fields),
      canPublishPublic: canPublishPublic(fields),
      maxVideoSec: entitlements.maxVideoSec,
      maxUploadBytes: entitlements.maxUploadBytes,
      maxProjects: entitlements.maxProjects,
      maxSocialLinks: entitlements.maxSocialLinks,
      customThumbnail: entitlements.customThumbnail,
      removeBranding: entitlements.removeBranding,
      showProBadge: entitlements.showProBadge,
      showFounderBadge: entitlements.showFounderBadge,
    });
  } catch (error) {
    console.error('Entitlements error:', error);
    const entitlements = getEntitlements({});
    return NextResponse.json({
      tier: entitlements.tier,
      label: entitlements.label,
      plan: 'free',
      planStatus: 'expired',
      planExpiresAt: null,
      isFounder: false,
      isTrialing: false,
      trialDaysRemaining: null,
      canPublishPublic: false,
      maxVideoSec: entitlements.maxVideoSec,
      maxUploadBytes: entitlements.maxUploadBytes,
      maxProjects: entitlements.maxProjects,
      maxSocialLinks: entitlements.maxSocialLinks,
      customThumbnail: entitlements.customThumbnail,
      removeBranding: entitlements.removeBranding,
      showProBadge: entitlements.showProBadge,
      showFounderBadge: entitlements.showFounderBadge,
    });
  }
}
