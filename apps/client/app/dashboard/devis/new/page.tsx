import { MotionReveal } from "@/components/motion/reveal";
import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { FormPageHeader } from "../../_components/layout/form-page-header";
import { QuoteForm } from "../_components/quote-form";
import { fetchQuoteClients } from "../_lib/server";

export default async function NewQuotePage() {
    const session = await requireBillingFeature("quotes_module");
    const currentUserId = session.user.id;
    const [clients, dashboard] = await Promise.all([fetchQuoteClients(currentUserId), fetchDashboardData(currentUserId)]);

    return (
        <DashboardShell
            firstName={session.user.firstName?.trim() || "équipe"}
            email={session.user.email}
            summary={dashboard.summary}
            interactionsCount={dashboard.interactions.length}
            activeMenu="devis"
            searchClients={dashboard.clients}
            searchInteractions={dashboard.interactions}
            searchProjects={dashboard.projects}
        >
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <FormPageHeader
                    title="Nouveau devis"
                    returnHref="/dashboard/devis"
                    returnLabel="Retour"
                    submitLabel="Créer le devis"
                    formId="quote-form"
                    returnIcon="arrow-left"
                    submitIcon="save"
                />
                <MotionReveal delay={80}>
                    <QuoteForm currentUserId={currentUserId} clients={clients} />
                </MotionReveal>
            </main>
        </DashboardShell>
    );
}
