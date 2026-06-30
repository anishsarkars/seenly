import type { PlanTier } from '@/lib/plans';
import { PLANS } from '@/lib/plans';

/** User-facing feature bullets per plan (matches pricing page). */
export const PLAN_FEATURE_LISTS: Record<PlanTier, string[]> = {
  free: [
    '1 public profile',
    '60-second intro video',
    'Max 50 MB upload',
    'Resume upload',
    'Up to 3 projects',
    'Up to 5 social links',
    'Seenly watermark',
    'Basic analytics',
  ],
  pro: [
    'Everything in Free, plus:',
    'Blue verified tick on profile',
    '3-minute intro video',
    '100 MB uploads',
    'Unlimited projects',
    'Unlimited links',
    'Custom video thumbnail',
    'Remove Seenly branding',
    'Priority support',
  ],
  founder: [
    'Everything in Pro, forever.',
    'Golden verified tick on profile',
    'All future Pro features',
    'Lifetime updates',
    'Coming soon: more',
  ],
};

export function getPlanFeatureList(tier: PlanTier): string[] {
  return PLAN_FEATURE_LISTS[tier];
}

export function describePlanLimits(tier: PlanTier): string {
  const e = PLANS[tier];
  const projects =
    e.maxProjects === Number.POSITIVE_INFINITY ? 'Unlimited projects' : `Up to ${e.maxProjects} projects`;
  const links =
    e.maxSocialLinks === Number.POSITIVE_INFINITY ? 'Unlimited links' : `Up to ${e.maxSocialLinks} social links`;
  const video = e.maxVideoSec <= 60 ? '60-second intro video' : '3-minute intro video';
  const upload = `${Math.round(e.maxUploadBytes / (1024 * 1024))} MB uploads`;
  const branding = e.removeBranding ? 'No Seenly watermark' : 'Seenly watermark';
  return [video, upload, projects, links, branding].join(' · ');
}
