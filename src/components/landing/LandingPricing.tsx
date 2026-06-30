import PricingTierGrid from '@/components/billing/PricingTierGrid';

export default function LandingPricing() {
  return (
    <section id="pricing" className="relative bg-black px-5 py-16 sm:px-6 sm:py-24 md:px-12 md:py-28 lg:px-16">
      <PricingTierGrid variant="landing" />
    </section>
  );
}
