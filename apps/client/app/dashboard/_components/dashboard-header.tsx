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
        <div className="crm-card rounded-[1.75rem] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Espace connecté
                        <span className="font-medium text-slate-950">{session.user?.email}</span>
                    </div>
                    <div>
                        <h1 className="display-title text-2xl text-slate-950 md:text-3xl">Dashboard CRM</h1>
                        <p className="text-sm text-slate-600">
                            Suivez vos activités et vos projets au même endroit.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Badge variant="secondary" className="bg-orange-50 text-orange-700 uppercase">
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
                    <Button asChild className="btn-dark rounded-full border-0">
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
