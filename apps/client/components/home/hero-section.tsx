import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { STACK_BADGES } from "./constants";
import { DashboardPreview } from "./dashboard-preview";
import type { SessionData } from "./types";

export function HeroSection({ session }: { session: SessionData }) {
  return (
    <section id="hero" className="py-4 md:py-6">
      <div className="grid items-stretch gap-6 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 md:p-8">
          <div className="mb-5 flex flex-wrap gap-2">
            {STACK_BADGES.map((tech) => (
              <Badge key={tech} variant="outline" className="border-slate-200 bg-[#f3f4fa] text-slate-700">
                {tech}
              </Badge>
            ))}
          </div>

          <h1 className="display-title text-3xl text-slate-950 md:text-4xl">Le CRM KAHIER pour centraliser vos clients et projets.</h1>
          <p className="mt-3 max-w-xl text-slate-600">Une base claire, lisible et prête à évoluer avec la même logique visuelle que votre dashboard.</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {session ? (
              <>
                <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/dashboard">
                    Accéder au dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <Link href="#features">Voir les fonctionnalités</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/register">
                    Créer un compte <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <Link href="/login">Se connecter</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
