import { requireAuth } from "@/lib/authz";
import { getServerApiBase } from "@/lib/api-base";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { FormPageHeader } from "../../_components/layout/form-page-header";
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
                <FormPageHeader
                    title="Nouveau projet"
                    returnHref="/dashboard/projects"
                    returnLabel="Retour liste"
                    submitLabel="Créer le projet"
                    formId="project-form"
                    returnIcon="layout-grid"
                    submitIcon="save"
                />
                <CreateProjectForm
                    currentUserId={currentUserId}
                    currentUserRole={session.user?.role ?? "USER"}
                    clients={clients}
                    owners={owners}
                />
            </div>
        </DashboardShell>
    );
}
