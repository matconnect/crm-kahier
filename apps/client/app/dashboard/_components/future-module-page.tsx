import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { MotionReveal } from "@/components/motion/reveal";

import { fetchDashboardData } from "./data/data";
import { DashboardShell } from "./layout/dashboard-shell";
import type { ActiveMenuKey } from "./layout/types";

type FutureModulePageProps = {
    title: string;
    description: string;
    activeMenu: ActiveMenuKey;
};

const MODULE_NEXT_STEPS = [
    "Structurer la donnée et les statuts métier du module",
    "Brancher les endpoints API + permissions",
    "Ajouter les vues liste / détail / création",
];

export async function FutureModulePage({ title, description, activeMenu }: FutureModulePageProps) {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";
    const firstName = session.user?.firstName?.trim() || "équipe";
    const { summary, interactions, clients, projects } = await fetchDashboardData(currentUserId);

    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={summary}
            interactionsCount={interactions.length}
            activeMenu={activeMenu}
            searchClients={clients}
            searchInteractions={interactions}
            searchProjects={projects}
        >
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                <MotionReveal>
                    <section className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#e1e4ef] bg-white px-3 py-1 text-xs text-[#6f7488]">
                                <Sparkles className="h-3.5 w-3.5" />
                                Module à venir
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                                <p className="mt-2 text-sm text-[#6f7488]">{description}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/projects"
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 py-2 text-sm font-medium text-[#2f3344]"
                                >
                                    Voir les projets actifs
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 py-2 text-sm font-medium text-[#2f3344]"
                                >
                                    Configurer l&apos;organisation
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </MotionReveal>
            </div>
        </DashboardShell>
    );
}
