import type { PlanTier } from '@/lib/plans';
import { PLANS } from '@/lib/plans';

/** User-facing feature bullets per plan (matches pricing page). */
export const PLAN_FEATURE_LISTS: Record<PlanTier, string[]> = {
  free: [
    '1 public profile',
    '30-second intro video',
    'Max 25 MB upload',
    '1 project',
    'Up to 2 social links',
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
  ],
  founder: [
    'Everything in Pro, forever.',
    'Golden verified tick on profile',
    'Custom page style & section order',
    'All future Pro features',
    'Lifetime updates',
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
  const video =
    e.maxVideoSec < 60
      ? `${e.maxVideoSec}-second intro video`
      : e.maxVideoSec <= 60
        ? '60-second intro video'
        : '3-minute intro video';
  const upload = `${Math.round(e.maxUploadBytes / (1024 * 1024))} MB uploads`;
  const branding = e.removeBranding ? 'No Seenly watermark' : 'Seenly watermark';
  return [video, upload, projects, links, branding].join(' · ');
}
