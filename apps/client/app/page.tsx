import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, LayoutGrid, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MotionReveal } from "@/components/motion/reveal";
import { auth } from "@/lib/session";

const quickPoints = [
  {
    icon: Users,
    label: "Clients",
  },
  {
    icon: LayoutGrid,
    label: "Projets",
  },
  {
    icon: Check,
    label: "Facturation",
  },
];

const pricingPlans = [
  {
    name: "Démarrage",
    price: "0€",
    detail: "/ mois",
    note: "Pour commencer",
    features: ["1 utilisateur", "200 contacts", "Gestion clients"],
  },
  {
    name: "Professionnel",
    price: "29€",
    detail: "/ mois",
    note: "ou 24€/mois en annuel",
    features: ["10 utilisateurs", "Finance", "Devis et factures"],
    highlighted: true,
  },
  {
    name: "Entreprise",
    price: "79€",
    detail: "/ mois",
    note: "ou 65€/mois en annuel",
    features: ["Utilisateurs étendus", "Modules complets", "Pilotage avancé"],
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="px-4 pt-4 md:px-6 md:pt-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-black/10 bg-white px-4 py-3 md:px-5">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/icons/jwin-1.png"
              alt="Logo KAHIER"
              width={38}
              height={38}
              className="rounded-xl border border-black/10"
              priority
            />
            <div className="leading-none">
              <p className="text-sm font-medium text-black/60">CRM</p>
              <p className="text-base font-semibold text-black">KAHIER</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {session ? (
              <Button asChild className="rounded-full bg-black px-4 text-white hover:bg-black/90">
                <Link href="/dashboard">
                  Ouvrir le dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full border border-black/10 bg-white text-black hover:bg-black/[0.04]"
                >
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild className="rounded-full bg-black px-4 text-white hover:bg-black/90">
                  <Link href="/register">
                    Créer un compte
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 pb-8 pt-4 md:px-6 md:pb-10 md:pt-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <MotionReveal>
            <section className="overflow-hidden rounded-[32px] bg-black text-white">
              <div className="grid gap-6 px-6 py-8 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] md:px-8 md:py-10">
                <div className="flex flex-col justify-between gap-8">
                  <div className="max-w-2xl">
                    <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                      Piloter l&apos;activité
                      <br />
                      en un seul espace.
                    </h1>
                    <p className="mt-4 max-w-lg text-base text-white/70 md:text-lg">
                      Clients, projets, devis, factures.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {session ? (
                      <Button
                        asChild
                        className="rounded-full bg-white px-5 text-black hover:bg-white/90"
                      >
                        <Link href="/dashboard">
                          Aller au dashboard
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : (
                      <>
                        <Button
                          asChild
                          className="rounded-full bg-white px-5 text-black hover:bg-white/90"
                        >
                          <Link href="/register">
                            Commencer
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          className="rounded-full border border-white/20 bg-transparent px-5 text-white hover:bg-white/10"
                        >
                          <Link href="/login">Se connecter</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex min-h-[260px] flex-col justify-between rounded-[28px] border border-white/10 bg-white/[0.06] p-5 md:min-h-[420px]">
                  <div className="grid gap-3">
                    {quickPoints.map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-medium text-white">{label}</span>
                        </div>
                        <span className="text-sm text-white/45">OK</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[24px] bg-white p-5 text-black">
                    <p className="text-sm text-black/55">Vue simple</p>
                    <p className="mt-2 text-2xl font-semibold">Claire. Rapide. Lisible.</p>
                  </div>
                </div>
              </div>
            </section>
          </MotionReveal>

          <MotionReveal delay={100}>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[28px] border border-black/10 bg-[#f5f5f5] p-6">
                <p className="text-sm text-black/55">CRM</p>
                <p className="mt-2 text-xl font-semibold">Une base propre pour suivre les clients.</p>
              </div>
              <div className="rounded-[28px] border border-black/10 bg-white p-6">
                <p className="text-sm text-black/55">Pilotage</p>
                <p className="mt-2 text-xl font-semibold">Des projets visibles sans surcharge.</p>
              </div>
              <div className="rounded-[28px] border border-black/10 bg-[#f5f5f5] p-6">
                <p className="text-sm text-black/55">Facturation</p>
                <p className="mt-2 text-xl font-semibold">Devis et factures dans le même flux.</p>
              </div>
            </section>
          </MotionReveal>
          <MotionReveal delay={160}>
            <section className="rounded-[32px] border border-black/10 bg-white p-6 md:p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl font-semibold md:text-4xl">Tarifs</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {pricingPlans.map((plan) => (
                  <div
                    key={plan.name}
                    className={
                      plan.highlighted
                        ? "rounded-[28px] bg-black p-6 text-white"
                        : "rounded-[28px] border border-black/10 bg-[#f5f5f5] p-6 text-black"
                    }
                  >
                    <div className="flex min-h-[180px] flex-col justify-between gap-6">
                      <div>
                        <p className={plan.highlighted ? "text-sm text-white/60" : "text-sm text-black/55"}>
                          {plan.name}
                        </p>
                        <div className="mt-3 flex items-end gap-1">
                          <span className="text-4xl font-semibold">{plan.price}</span>
                          <span className={plan.highlighted ? "pb-1 text-sm text-white/60" : "pb-1 text-sm text-black/55"}>
                            {plan.detail}
                          </span>
                        </div>
                        <p className={plan.highlighted ? "mt-2 text-sm text-white/70" : "mt-2 text-sm text-black/60"}>
                          {plan.note}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2">
                            <Check className={plan.highlighted ? "h-4 w-4 text-white" : "h-4 w-4 text-black"} />
                            <span className={plan.highlighted ? "text-sm text-white/85" : "text-sm text-black/75"}>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </MotionReveal>
        </div>
      </main>
    </div>
  );
}
