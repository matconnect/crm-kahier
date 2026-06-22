import Link from "next/link";
import { ArrowRight, Menu } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

import type { SessionData } from "./types";

export function TopBar({ session }: { session: SessionData }) {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 md:px-6">
      <div className="mx-auto max-w-[1400px] rounded-[1.75rem] border border-slate-200 bg-[#f3f4fa]/95 px-4 py-4 shadow-sm md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <Image src="/icons/jwin-1.png" alt="Logo KAHIER" width={36} height={36} className="rounded-lg" priority />
            <div className="leading-tight">
              <div className="text-[0.68rem] uppercase  text-slate-500">CRM</div>
              <div className="font-black text-base text-slate-950">KAHIER</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <a href="#features" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">Fonctionnalités</a>
            <a href="#organisation" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">Organisation</a>
            <a href="#pricing" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">Tarifs</a>
            <a href="#cta" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">Démarrer</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {session ? (
              <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                <Link href="/dashboard">
                  Accéder au dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
                  <Link href="/register">
                    Créer un compte <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          <details className="ml-auto md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-slate-200 bg-white marker:content-none">
              <Menu className="h-4 w-4" />
            </summary>
            <div className="absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-lg">
              <nav className="grid gap-2">
                <a href="#features" className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">Fonctionnalités</a>
                <a href="#organisation" className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">Organisation</a>
                <a href="#pricing" className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">Tarifs</a>
                <a href="#cta" className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700">Démarrer</a>
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
