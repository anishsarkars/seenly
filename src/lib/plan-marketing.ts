import type { PlanTier } from '@/lib/plans';

export const FINAL_BOSS_LABEL = 'Seenly Final boss!';
export const SUPPORT_EMAIL = 'hello@anishsarkar.site';

export const PLAN_MARKETING_BENEFITS: Record<Exclude<PlanTier, 'free'>, string[]> = {
  pro: [
    '3-minute intro video',
    '250 MB uploads',
    'Unlimited projects & links',
    'Custom video thumbnail',
    'Remove Seenly branding',
    'Priority support',
  ],
  founder: [
    'Everything in Pro, forever',
    'Final boss badge on your profile',
    'All future Pro features included',
    'Lifetime updates',
  ],
};

export const PLAN_PRICES = {
  pro: { amount: '₹149', period: '/month' },
  founder: { amount: '₹1,999', period: ' one-time', was: '₹3,000' },
} as const;
