import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getUserBillingState } from '@/lib/billing/webhook-handler';
import { getEntitlements } from '@/lib/plans';

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
    const entitlements = getEntitlements(billing ?? {});

    return NextResponse.json({
      tier: entitlements.tier,
      label: entitlements.label,
      plan: billing?.plan ?? 'free',
      planStatus: billing?.planStatus ?? null,
      planExpiresAt: billing?.planExpiresAt ?? null,
      isFounder: billing?.isFounder ?? false,
      maxVideoSec: entitlements.maxVideoSec,
      maxUploadBytes: entitlements.maxUploadBytes,
      maxProjects: entitlements.maxProjects,
      maxSocialLinks: entitlements.maxSocialLinks,
      customThumbnail: entitlements.customThumbnail,
      removeBranding: entitlements.removeBranding,
      showFounderBadge: entitlements.showFounderBadge,
    });
  } catch (error) {
    console.error('Entitlements error:', error);
    const entitlements = getEntitlements({});
    return NextResponse.json({
      tier: entitlements.tier,
      label: entitlements.label,
      plan: 'free',
      planStatus: null,
      planExpiresAt: null,
      isFounder: false,
      maxVideoSec: entitlements.maxVideoSec,
      maxUploadBytes: entitlements.maxUploadBytes,
      maxProjects: entitlements.maxProjects,
      maxSocialLinks: entitlements.maxSocialLinks,
      customThumbnail: entitlements.customThumbnail,
      removeBranding: entitlements.removeBranding,
      showFounderBadge: entitlements.showFounderBadge,
    });
  }
}
