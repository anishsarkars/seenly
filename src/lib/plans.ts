export type PlanTier = 'free' | 'pro' | 'founder';
export type PlanStatus = 'active' | 'on_hold' | 'cancelled' | null;

export interface PlanEntitlements {
  tier: PlanTier;
  label: string;
  maxVideoSec: number;
  maxUploadBytes: number;
  maxProjects: number;
  maxSocialLinks: number;
  customThumbnail: boolean;
  removeBranding: boolean;
  showFounderBadge: boolean;
  prioritySupport: boolean;
}

export const PLANS: Record<PlanTier, PlanEntitlements> = {
  free: {
    tier: 'free',
    label: 'Free',
    maxVideoSec: 60,
    maxUploadBytes: 50 * 1024 * 1024,
    maxProjects: 3,
    maxSocialLinks: 5,
    customThumbnail: false,
    removeBranding: false,
    showFounderBadge: false,
    prioritySupport: false,
  },
  pro: {
    tier: 'pro',
    label: 'Seenly Pro',
    maxVideoSec: 180,
    maxUploadBytes: 250 * 1024 * 1024,
    maxProjects: Number.POSITIVE_INFINITY,
    maxSocialLinks: Number.POSITIVE_INFINITY,
    customThumbnail: true,
    removeBranding: true,
    showFounderBadge: false,
    prioritySupport: false,
  },
  founder: {
    tier: 'founder',
    label: 'Founder',
    maxVideoSec: 180,
    maxUploadBytes: 250 * 1024 * 1024,
    maxProjects: Number.POSITIVE_INFINITY,
    maxSocialLinks: Number.POSITIVE_INFINITY,
    customThumbnail: true,
    removeBranding: true,
    showFounderBadge: true,
    prioritySupport: true,
  },
};

export interface BillingUserFields {
  plan?: string | null;
  planStatus?: string | null;
  planExpiresAt?: Date | string | null;
  isFounder?: boolean | null;
}

export function getEffectiveTier(user: BillingUserFields): PlanTier {
  if (user.isFounder || user.plan === 'founder') return 'founder';

  if (user.plan === 'pro') {
    if (user.planStatus === 'active' || user.planStatus === 'on_hold') return 'pro';
    if (user.planStatus === 'cancelled' && user.planExpiresAt) {
      const expires = new Date(user.planExpiresAt);
      if (expires > new Date()) return 'pro';
    }
  }

  return 'free';
}

export function getEntitlements(user: BillingUserFields): PlanEntitlements {
  return PLANS[getEffectiveTier(user)];
}

export function formatUploadLimit(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function formatVideoLimit(seconds: number) {
  if (seconds <= 60) return '60 seconds';
  const minutes = Math.floor(seconds / 60);
  return `${minutes} minutes`;
}

export function countFilledSocialLinks(socials: Record<string, string | undefined | null> | null | undefined) {
  if (!socials) return 0;
  return Object.values(socials).filter((value) => typeof value === 'string' && value.trim() !== '').length;
}
