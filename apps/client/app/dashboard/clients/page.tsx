import Link from "next/link";
import { MessageSquareText, Plus, Users, UserRound, BriefcaseBusiness } from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { MotionReveal } from "@/components/motion/reveal";

import { DashboardShell, fetchDashboardData } from "../_components";
import { ClientsFilters } from "./_components/clients-filters";
import { ClientsList } from "./_components/clients-list";

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
                                <div>
                                    <h1 className="text-2xl font-bold  md:text-3xl">Clients et prospects</h1>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/clients/new"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e1e4ef] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouveau client
                                </Link>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4 sm:gap-3">
                            <div className="rounded-[24px] border border-white/70 bg-white p-3 shadow-sm sm:p-5">
                                <Users className="h-3.5 w-3.5 text-slate-500 sm:h-4 sm:w-4" />
                                <p className="mt-3 text-xs text-slate-500 sm:mt-4 sm:text-sm">Total clients</p>
                                <p className="mt-1 text-lg font-semibold text-slate-950 sm:text-2xl">{clients.length}</p>
                            </div>
                            <div className="rounded-[24px] border border-white/70 bg-white p-3 shadow-sm sm:p-5">
                                <UserRound className="h-3.5 w-3.5 text-slate-500 sm:h-4 sm:w-4" />
                                <p className="mt-3 text-xs text-slate-500 sm:mt-4 sm:text-sm">Clients actifs</p>
                                <p className="mt-1 text-lg font-semibold text-slate-950 sm:text-2xl">{summary.active}</p>
                            </div>
                            <div className="rounded-[24px] border border-white/70 bg-white p-3 shadow-sm sm:p-5">
                                <BriefcaseBusiness className="h-3.5 w-3.5 text-slate-500 sm:h-4 sm:w-4" />
                                <p className="mt-3 text-xs text-slate-500 sm:mt-4 sm:text-sm">Prospects</p>
                                <p className="mt-1 text-lg font-semibold text-slate-950 sm:text-2xl">{summary.prospects}</p>
                            </div>
                            <div className="rounded-[24px] border border-white/70 bg-white p-3 shadow-sm sm:p-5">
                                <MessageSquareText className="h-3.5 w-3.5 text-slate-500 sm:h-4 sm:w-4" />
                                <p className="mt-3 text-xs text-slate-500 sm:mt-4 sm:text-sm">Interactions</p>
                                <p className="mt-1 text-lg font-semibold text-slate-950 sm:text-2xl">{summary.interactions}</p>
                            </div>
                        </div>
                    </section>
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
