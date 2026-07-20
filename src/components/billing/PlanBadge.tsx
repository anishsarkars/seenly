import {
  getEntitlements,
  getTrialDaysRemaining,
  isTrialing,
  type BillingUserFields,
} from '@/lib/plans';

interface PlanBadgeProps {
  user: BillingUserFields;
  className?: string;
}

export default function PlanBadge({ user, className = '' }: PlanBadgeProps) {
  const { label, tier } = getEntitlements(user);
  const days = getTrialDaysRemaining(user);
  const displayLabel =
    isTrialing(user) && days != null ? `Trial · ${days}d left` : label;

  const tone =
    tier === 'founder'
      ? 'border-amber-400/30 bg-amber-500/10 text-amber-200/95'
      : isTrialing(user)
        ? 'border-sky-400/25 bg-sky-500/10 text-sky-200/90'
        : tier === 'pro'
          ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200/90'
          : 'border-white/10 bg-white/5 text-white/45';

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        tier === 'founder' || isTrialing(user)
          ? 'normal-case tracking-tight'
          : 'uppercase tracking-wider'
      } ${tone} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
