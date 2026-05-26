import { auth } from "@/lib/session";

import { CtaSection } from "@/components/home/cta-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HeroSection } from "@/components/home/hero-section";
import { PricingSection } from "@/components/home/pricing-section";
import { SecuritySection } from "@/components/home/security-section";
import { TopBar } from "@/components/home/top-bar";
import { MotionReveal } from "@/components/motion/reveal";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-[#dfe1ea]">
      <TopBar session={session} />

      <main className="px-4 pb-10 pt-6 md:px-6 md:pb-14 md:pt-8">
        <div className="mx-auto max-w-[1400px] space-y-6">
          <MotionReveal>
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/45 p-3 md:p-4">
              <HeroSection session={session} />
            </section>
          </MotionReveal>

          <MotionReveal delay={80}>
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/45 px-4 py-2 md:px-6 md:py-3">
              <FeaturesSection />
            </section>
          </MotionReveal>

          <MotionReveal delay={140}>
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/45 px-4 py-2 md:px-6 md:py-3">
              <SecuritySection />
            </section>
          </MotionReveal>

          <MotionReveal delay={180}>
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/45 px-4 py-2 md:px-6 md:py-3">
              <PricingSection />
            </section>
          </MotionReveal>

          <MotionReveal delay={220}>
            <section className="rounded-[2rem] border border-slate-200/80 bg-white/45 px-4 py-2 md:px-6 md:py-3">
              <CtaSection session={session} />
            </section>
          </MotionReveal>
        </div>
      </main>
    </div>
  );
}
