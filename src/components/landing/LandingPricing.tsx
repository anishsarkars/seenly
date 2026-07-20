import PricingTierGrid from '@/components/billing/PricingTierGrid';

export default function LandingPricing() {
  return (
    <section id="pricing" className="relative bg-black px-5 py-16 text-white sm:px-6 sm:py-24 md:px-12 md:py-28 lg:px-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black to-transparent" />
      <PricingTierGrid variant="landing" />
    </section>
  );
}

