import Link from "next/link";
import { LayoutGrid, Save } from "lucide-react";

import { requireAuth } from "@/lib/authz";
import { getServerApiBase } from "@/lib/api-base";
import { MotionReveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { CreateProjectForm, type ClientOption, type OwnerOption } from "./create-project-form";

async function fetchClients(apiBase: string, currentUserId: string): Promise<ClientOption[]> {
    try {
        const response = await fetch(`${apiBase}/clients?page=1&pageSize=100`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!response.ok) return [];
        const data = (await response.json()) as { items?: ClientOption[] };
        return data.items ?? [];
    } catch {
        return [];
    }
}

async function fetchOwners(apiBase: string, currentUserId: string, fallbackEmail?: string | null): Promise<OwnerOption[]> {
    try {
        const response = await fetch(`${apiBase}/users`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!response.ok) {
            return [{ id: currentUserId, label: fallbackEmail ?? "Moi", email: fallbackEmail }];
        }
        const data = (await response.json()) as { users?: OwnerOption[] };
        return data.users?.length ? data.users : [{ id: currentUserId, label: fallbackEmail ?? "Moi", email: fallbackEmail }];
    } catch {
        return [{ id: currentUserId, label: fallbackEmail ?? "Moi", email: fallbackEmail }];
    }
}

export default async function NewProjectPage() {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";
    const firstName = session.user?.firstName?.trim() || "équipe";
    const apiBase = getServerApiBase();

    const [clients, owners, dashboardData] = await Promise.all([
        apiBase ? fetchClients(apiBase, currentUserId) : Promise.resolve([]),
        apiBase
            ? fetchOwners(apiBase, currentUserId, session.user?.email)
            : Promise.resolve([{ id: currentUserId, label: session.user?.email ?? "Moi", email: session.user?.email }]),
        fetchDashboardData(currentUserId),
    ]);

    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={dashboardData.summary}
            interactionsCount={dashboardData.interactions.length}
            activeMenu="projects"
            searchClients={dashboardData.clients}
            searchInteractions={dashboardData.interactions}
            searchProjects={dashboardData.projects}
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" id="project-form">
                <MotionReveal>
                    <div className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold  md:text-3xl">Nouveau projet</h1>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/projects"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    Retour liste
                                </Link>
                                <Button asChild className="h-10 rounded-full border-0 bg-[#111322] px-4 text-white hover:bg-[#191d2e]">
                                    <button type="submit" form="project-form">
                                        <Save className="h-4 w-4" />
                                        Créer le projet
                                    </button>
                                </Button>
                            </div>
                        </div>
                    </div>
                </MotionReveal>

                <MotionReveal delay={100}>
                    <CreateProjectForm
                        currentUserId={currentUserId}
                        currentUserRole={session.user?.role ?? "USER"}
                        clients={clients}
                        owners={owners}
                    />
                </MotionReveal>
            </div>
        </DashboardShell>
    );
}
