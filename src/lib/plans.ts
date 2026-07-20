export type PlanTier = 'free' | 'pro' | 'founder';
export type PlanStatus = 'active' | 'on_hold' | 'cancelled' | 'trialing' | 'expired' | null;

export const TRIAL_DAYS = 14;

export interface PlanEntitlements {
  tier: PlanTier;
  label: string;
  maxVideoSec: number;
  maxUploadBytes: number;
  maxProjects: number;
  maxSocialLinks: number;
  customThumbnail: boolean;
  removeBranding: boolean;
  showProBadge: boolean;
  showFounderBadge: boolean;
  prioritySupport: boolean;
  customProfileLayout: boolean;
}

/** `free` = trial ended / unpaid — editing allowed, public profiles blocked. */
export const PLANS: Record<PlanTier, PlanEntitlements> = {
  free: {
    tier: 'free',
    label: 'Trial ended',
    maxVideoSec: 60,
    maxUploadBytes: 50 * 1024 * 1024,
    maxProjects: 3,
    maxSocialLinks: 5,
    customThumbnail: false,
    removeBranding: false,
    showProBadge: false,
    showFounderBadge: false,
    prioritySupport: false,
    customProfileLayout: false,
  },
  pro: {
    tier: 'pro',
    label: 'Seenly Pro',
    maxVideoSec: 180,
    maxUploadBytes: 100 * 1024 * 1024,
    maxProjects: Number.POSITIVE_INFINITY,
    maxSocialLinks: Number.POSITIVE_INFINITY,
    customThumbnail: true,
    removeBranding: true,
    showProBadge: true,
    showFounderBadge: false,
    prioritySupport: false,
    customProfileLayout: false,
  },
  founder: {
    tier: 'founder',
    label: 'Seenly Final boss!',
    maxVideoSec: 180,
    maxUploadBytes: 100 * 1024 * 1024,
    maxProjects: Number.POSITIVE_INFINITY,
    maxSocialLinks: Number.POSITIVE_INFINITY,
    customThumbnail: true,
    removeBranding: true,
    showProBadge: false,
    showFounderBadge: true,
    prioritySupport: true,
    customProfileLayout: true,
  },
};

export interface BillingUserFields {
  plan?: string | null;
  planStatus?: string | null;
  planExpiresAt?: Date | string | null;
  isFounder?: boolean | null;
}

function expiresInFuture(expiresAt: Date | string | null | undefined): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
}

export function isTrialing(user: BillingUserFields): boolean {
  return user.planStatus === 'trialing' && expiresInFuture(user.planExpiresAt);
}

export function isTrialExpiredStatus(user: BillingUserFields): boolean {
  if (user.isFounder || user.plan === 'founder') return false;
  if (user.planStatus === 'expired') return true;
  if (user.planStatus === 'trialing' && user.planExpiresAt && !expiresInFuture(user.planExpiresAt)) {
    return true;
  }
  return getEffectiveTier(user) === 'free';
}

export function getEffectiveTier(user: BillingUserFields): PlanTier {
  if (user.isFounder || user.plan === 'founder') return 'founder';

  if (user.plan === 'pro') {
    if (user.planStatus === 'active' || user.planStatus === 'on_hold') return 'pro';
    if (user.planStatus === 'cancelled' && expiresInFuture(user.planExpiresAt)) return 'pro';
    if (user.planStatus === 'trialing' && expiresInFuture(user.planExpiresAt)) return 'pro';
  }

  return 'free';
}

/** Public profiles require an active paid plan or an unexpired trial. */
export function canPublishPublic(user: BillingUserFields): boolean {
  return getEffectiveTier(user) !== 'free';
}

export function getEntitlements(user: BillingUserFields): PlanEntitlements {
  const tier = getEffectiveTier(user);
  const base = PLANS[tier];
  if (tier === 'pro' && isTrialing(user)) {
    return { ...base, label: 'Pro trial', showProBadge: false };
  }
  return base;
}

export function getTrialDaysRemaining(user: BillingUserFields): number | null {
  if (!isTrialing(user) || !user.planExpiresAt) return null;
  const ms = new Date(user.planExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function trialEndsAtFromNow(days = TRIAL_DAYS): Date {
  const ends = new Date();
  ends.setDate(ends.getDate() + days);
  return ends;
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
