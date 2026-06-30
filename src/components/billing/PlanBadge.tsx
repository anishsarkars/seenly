import { getEntitlements, type BillingUserFields } from '@/lib/plans';

interface PlanBadgeProps {
  user: BillingUserFields;
  className?: string;
}

export default function PlanBadge({ user, className = '' }: PlanBadgeProps) {
  const { label, tier } = getEntitlements(user);

  const tone =
    tier === 'founder'
      ? 'border-amber-400/30 bg-amber-500/10 text-amber-200/95'
      : tier === 'pro'
        ? 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200/90'
        : 'border-white/10 bg-white/5 text-white/45';

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        tier === 'founder' ? 'normal-case tracking-tight' : 'uppercase tracking-wider'
      } ${tone} ${className}`}
    >
      {label}
    </span>
  );
}
