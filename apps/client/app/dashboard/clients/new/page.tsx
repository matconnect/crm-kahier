import Link from "next/link";
import { LayoutGrid, Save } from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { MotionReveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { CreateClientForm } from "./create-client-form";

export default async function NewClientPage() {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";
    const currentUserLabel = session.user?.email ?? "Moi";
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
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" id="client-form">
                <MotionReveal>
                    <div className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold  md:text-3xl">Nouveau client</h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/clients"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    Retour liste
                                </Link>
                                <Button asChild className="h-10 rounded-full border-0 bg-[#111322] px-4 text-white hover:bg-[#191d2e]">
                                    <button type="submit" form="client-create-form">
                                        <Save className="h-4 w-4" />
                                        Créer le client
                                    </button>
                                </Button>
                            </div>
                        </div>
                    </div>
                </MotionReveal>

                <MotionReveal delay={100}>
                    <CreateClientForm
                        currentUserId={currentUserId}
                        currentUserLabel={currentUserLabel}
                        currentUserEmail={session.user?.email}
                    />
                </MotionReveal>
            </div>
        </DashboardShell>
    );
}
