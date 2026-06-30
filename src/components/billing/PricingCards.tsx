'use client';

import PricingTierGrid, { PricingPageFooter } from '@/components/billing/PricingTierGrid';
import { type PlanTier } from '@/lib/plans';

interface PricingCardsProps {
  currentTier?: PlanTier;
  isSignedIn?: boolean;
}

export default function PricingCards({ currentTier, isSignedIn }: PricingCardsProps) {
  return <PricingTierGrid variant="checkout" showHeader={false} currentTier={currentTier} isSignedIn={isSignedIn} />;
}

export { PricingPageFooter };
