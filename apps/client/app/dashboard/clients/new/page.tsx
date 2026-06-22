import { requireAuth } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { FormPageHeader } from "../../_components/layout/form-page-header";
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
                <FormPageHeader
                    title="Nouveau client"
                    returnHref="/dashboard/clients"
                    returnLabel="Retour liste"
                    submitLabel="Créer le client"
                    formId="client-create-form"
                    returnIcon="layout-grid"
                    submitIcon="save"
                />
                <CreateClientForm
                    currentUserId={currentUserId}
                    currentUserLabel={currentUserLabel}
                    currentUserEmail={session.user?.email}
                />
            </div>
        </DashboardShell>
    );
}
