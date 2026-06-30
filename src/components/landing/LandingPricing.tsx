import Link from 'next/link';
import { Check } from 'lucide-react';
import { btnPrimary, btnSecondary } from '@/lib/platform-ui';
import { PLAN_PRICES } from '@/lib/plan-marketing';

const TIERS = [
  {
    name: 'Free',
    price: '₹0',
    period: '',
    highlight: false,
    features: ['60s video', '50 MB upload', '3 projects', 'Seenly watermark'],
    cta: { label: 'Get started', href: '/onboarding', primary: false },
  },
  {
    name: 'Pro',
    price: PLAN_PRICES.pro.amount,
    period: PLAN_PRICES.pro.period,
    highlight: true,
    features: ['3-min video', '250 MB upload', 'Unlimited projects', 'No watermark'],
    cta: { label: 'Upgrade to Pro', href: '/pricing', primary: true },
  },
  {
    name: 'Founder',
    price: PLAN_PRICES.founder.amount,
    period: '',
    highlight: false,
    features: ['Pro forever', 'Founder badge', 'Future features', 'Launch offer'],
    cta: { label: 'View Founder', href: '/pricing', primary: false },
  },
] as const;

export default function LandingPricing() {
  return (
    <section id="pricing" className="relative border-t border-white/[0.06] bg-black px-5 py-20 sm:px-6 sm:py-24 md:px-12 lg:px-16">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white/55">
            Pricing
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Simple plans. Start free.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
            Upgrade when you need longer videos, bigger uploads, and a cleaner public profile.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-lg border p-5 ${
                tier.highlight
                  ? 'border-emerald-500/25 bg-white/[0.04] ring-1 ring-emerald-500/10'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <p className="text-sm font-medium text-white/55">{tier.name}</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-white">
                {tier.price}
                {tier.period && <span className="text-sm font-normal text-white/40">{tier.period}</span>}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/55">
                    <Check className="h-3 w-3 shrink-0 text-emerald-400/70" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.cta.href}
                className={`mt-5 block text-center text-sm ${tier.cta.primary ? btnPrimary : btnSecondary}`}
              >
                {tier.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
