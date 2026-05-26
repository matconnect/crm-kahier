import { requireAuth } from "@/lib/authz";

import {
    DashboardShell,
    HomeDashboardOverview,
    fetchDashboardData,
} from "./_components";

type DashboardPageProps = {
    searchParams: Promise<{ q?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";
    const firstName = session.user?.firstName?.trim() || "équipe";
    const sp = await searchParams;
    const { summary, interactions, clients, projects } = await fetchDashboardData(currentUserId);

    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={summary}
            interactionsCount={interactions.length}
            activeMenu="interactions"
            searchValue={sp.q ?? ""}
            searchClients={clients}
            searchInteractions={interactions}
            searchProjects={projects}
        >
            <HomeDashboardOverview summary={summary} interactions={interactions} clients={clients} projects={projects} />
        </DashboardShell>
    );
}
