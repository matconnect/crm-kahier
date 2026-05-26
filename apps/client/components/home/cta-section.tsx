import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { SessionData } from "./types";

export function CtaSection({ session }: { session: SessionData }) {
  return (
    <section id="cta" className="py-10 md:py-12">
      <Card className="rounded-[1.75rem] border border-slate-200 bg-white shadow-none">
        <CardContent className="flex flex-col items-start justify-between gap-5 p-6 md:flex-row md:items-center md:p-8">
          <div className="space-y-2">
            <div className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-slate-500">Prêt à démarrer</div>
            <div className="display-title text-2xl text-slate-950">Accédez à votre espace</div>
            <div className="text-sm text-slate-600">
              {session ? "Continuez sur votre dashboard." : "Créez votre compte et commencez en quelques secondes."}
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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
                  <Link href="/login">Connexion</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <footer className="py-8 text-center text-xs uppercase tracking-[0.22em] text-slate-500">© {new Date().getFullYear()} KAHIER CRM</footer>
    </section>
  );
}
