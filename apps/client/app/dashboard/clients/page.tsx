import Link from "next/link";
import { Plus } from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { MotionReveal } from "@/components/motion/reveal";

import { DashboardShell, fetchDashboardData } from "../_components";
import { ClientsFilters } from "./_components/clients-filters";
import { ClientsList } from "./_components/clients-list";
import { ClientsSummary } from "./_components/clients-summary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
    searchParams: Promise<{
        q?: string;
        status?: string;
        segment?: string;
        location?: string;
        page?: string;
        pageSize?: string;
    }>;
};

export default async function ClientsPage({ searchParams }: PageProps) {
    const session = await requireAuth();
    const sp = await searchParams;
    const currentUserId = session.user?.id ?? "";
    const currentUserRole = session.user?.role ?? "USER";
    const firstName = session.user?.firstName?.trim() || "équipe";

    const { summary, interactions, clients, projects } = await fetchDashboardData(currentUserId);

    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={summary}
            interactionsCount={interactions.length}
            activeMenu="clients"
            searchClients={clients}
            searchInteractions={interactions}
            searchProjects={projects}
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <MotionReveal>
                    <section className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#e1e4ef] bg-white px-3 py-1 text-xs text-[#6f7488]">
                                    Vue clients
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Connecté : {session.user?.email}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold  md:text-3xl">Clients et prospects</h1>
                                    <p className="text-sm text-[#6f7488]">
                                        Suivez vos comptes, contacts clés et dernières interactions.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/clients/new"
                                    className="inline-flex items-center gap-2 rounded-full border border-[#e1e4ef] bg-white px-4 py-2 text-sm font-medium"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouveau client
                                </Link>
                            </div>
                        </div>
                    </section>
                </MotionReveal>

                <MotionReveal delay={70}>
                    <div id="clients-summary" className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                        <ClientsSummary currentUserId={currentUserId} />
                    </div>
                </MotionReveal>
                <MotionReveal delay={130}>
                    <div id="clients-filters" className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                        <ClientsFilters searchParams={sp} />
                    </div>
                </MotionReveal>
                <MotionReveal delay={190}>
                    <div id="clients-list" className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                        <ClientsList searchParams={sp} currentUserId={currentUserId} currentUserRole={currentUserRole} />
                    </div>
                </MotionReveal>
            </div>
        </DashboardShell>
    );
}
