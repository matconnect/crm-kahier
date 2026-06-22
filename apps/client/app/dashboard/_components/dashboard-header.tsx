import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SessionData } from "@/lib/session";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
    session: SessionData;
};

export function DashboardHeader({ session }: DashboardHeaderProps) {
    const roleLabel =
        session.user?.role === "ADMIN"
            ? "Administrateur"
            : session.user?.role === "MANAGER"
                ? "Manager"
                : "Utilisateur";

    return (
        <div className="rounded-lg border border-slate-200 bg-white/95 p-6 shadow-[0_16px_42px_rgba(28,35,54,0.06)] backdrop-blur-sm transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-slate-950" />
                        Espace connecté
                        <span className="font-medium text-slate-950">{session.user?.email}</span>
                    </div>
                    <div>
                        <h1 className="font-black text-2xl text-slate-950 md:text-3xl">Tableau CRM</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 uppercase">
                            {roleLabel}
                        </Badge>
                        <span>Compte actif</span>
                        <span className="h-1 w-1 rounded-full bg-slate-400/70" />
                        <Link href="#activity" className="inline-flex items-center gap-1 hover:text-slate-950">
                            Activités récentes <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild className="h-10 rounded-full border border-slate-800 bg-slate-950 px-4 text-white hover:bg-black">
                        <Link href="/dashboard/clients">
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            Aller aux clients
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
