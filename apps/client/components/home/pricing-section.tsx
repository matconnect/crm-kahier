"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";

type BillingMode = "monthly" | "yearly";

type Plan = {
  id: "starter" | "pro" | "enterprise";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Essentiel",
    description: "Pour démarrer et structurer votre base clients.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Jusqu'à 200 contacts",
      "Pipeline commercial de base",
      "Historique des interactions",
      "1 utilisateur inclus",
    ],
    cta: "Commencer",
    href: "/register",
  },
  {
    id: "pro",
    name: "Professionnel",
    description: "Pour les équipes qui pilotent clients, projets et reporting.",
    monthlyPrice: 29,
    yearlyPrice: 24,
    features: [
      "Contacts illimités",
      "Suivi projets + interactions",
      "KPI et tableau de bord",
      "Jusqu'à 10 utilisateurs",
    ],
    cta: "Choisir professionnel",
    href: "/register",
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Entreprise",
    description: "Pour structures multi-équipes avec besoins avancés.",
    monthlyPrice: 79,
    yearlyPrice: 65,
    features: [
      "Utilisateurs illimités",
      "Droits avancés par rôle",
      "Accompagnement onboarding",
      "Support prioritaire",
    ],
    cta: "Contacter l'équipe",
    href: "/dashboard/settings",
  },
];

function formatPrice(value: number) {
  if (value === 0) return "0";
  return String(value);
}

export function PricingSection() {
  const [mode, setMode] = React.useState<BillingMode>("monthly");

  return (
    <section id="pricing" className="py-10 md:py-12">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 md:p-8">
        <div className="text-center">
          <p className="text-xs uppercase  text-slate-500">Tarifs</p>
          <h2 className="mt-2 display-title text-3xl text-slate-950 md:text-4xl">Choisissez votre plan</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
            Une grille claire, sans surprise, avec le même design que le dashboard.
          </p>

          <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-[#f3f4fa] p-1">
            <button
              type="button"
              onClick={() => setMode("monthly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                mode === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setMode("yearly")}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                mode === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              Annuel
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = mode === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const suffix = mode === "monthly" ? "/mois" : "/mois, facturé à l'année";
            const isEnterprise = plan.id === "enterprise";

            return (
              <article
                key={plan.id}
                className={`rounded-2xl border p-5 ${
                  plan.highlight
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-[#f8f9fd] text-slate-900"
                }`}
              >
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.highlight ? "text-slate-300" : "text-slate-600"}`}>{plan.description}</p>

                <div className="mt-5 flex items-end gap-2">
                  {isEnterprise ? (
                    <span className={`text-2xl font-bold leading-none ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                      Contactez-nous
                    </span>
                  ) : (
                    <>
                      <span className="text-4xl font-black leading-none">{formatPrice(price)}€</span>
                      <span className={`pb-1 text-xs ${plan.highlight ? "text-slate-300" : "text-slate-500"}`}>{suffix}</span>
                    </>
                  )}
                </div>

                <Button
                  asChild
                  className={`mt-5 w-full rounded-full ${
                    plan.highlight
                      ? "bg-white text-slate-900 hover:bg-slate-100"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>

                <ul className="mt-5 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-emerald-300" : "text-emerald-600"}`} />
                      <span className={plan.highlight ? "text-slate-200" : "text-slate-700"}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
