import { auth } from "@/lib/session";
import { Separator } from "@/components/ui/separator";

import { CtaSection } from "@/components/home/cta-section";
import { FeaturesSection } from "@/components/home/features-section";
import { HeroSection } from "@/components/home/hero-section";
import { SecuritySection } from "@/components/home/security-section";
import { TopBar } from "@/components/home/top-bar";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen">
      <TopBar session={session} />

      <main className="mx-auto max-w-6xl px-6">
        <HeroSection session={session} />

        <Separator />

        <FeaturesSection />

        <Separator />

        <SecuritySection />

        <CtaSection session={session} />
      </main>
    </div>
  );
}
