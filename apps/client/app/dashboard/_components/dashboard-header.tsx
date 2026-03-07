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
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Espace connecté
                        <span className="font-medium text-foreground">{session.user?.email}</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard CRM</h1>
                        <p className="text-sm text-muted-foreground">
                            Suivez vos activités et vos projets au même endroit.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="uppercase">
                            {roleLabel}
                        </Badge>
                        <span>Compte actif</span>
                        <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                        <Link href="#activity" className="inline-flex items-center gap-1 hover:text-foreground">
                            Activités récentes <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" asChild>
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
