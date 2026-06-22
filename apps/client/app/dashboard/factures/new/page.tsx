import { MotionReveal } from "@/components/motion/reveal";
import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { FormPageHeader } from "../../_components/layout/form-page-header";
import { InvoiceForm } from "../_components/invoice-form";
import { fetchInvoiceClients } from "../_lib/server";

export default async function NewInvoicePage() {
    const session = await requireBillingFeature("invoices_module");
    const currentUserId = session.user.id;
    const [clients, dashboard] = await Promise.all([
        fetchInvoiceClients(currentUserId),
        fetchDashboardData(currentUserId),
    ]);

    return (
        <DashboardShell
            firstName={session.user.firstName?.trim() || "équipe"}
            email={session.user.email}
            summary={dashboard.summary}
            interactionsCount={dashboard.interactions.length}
            activeMenu="factures"
            searchClients={dashboard.clients}
            searchInteractions={dashboard.interactions}
            searchProjects={dashboard.projects}
        >
            <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <FormPageHeader
                    title="Nouvelle facture"
                    returnHref="/dashboard/factures"
                    returnLabel="Retour"
                    submitLabel="Créer la facture"
                    formId="invoice-form"
                    returnIcon="arrow-left"
                    submitIcon="save"
                />
                <MotionReveal delay={80}>
                    <InvoiceForm currentUserId={currentUserId} clients={clients} />
                </MotionReveal>
            </main>
        </DashboardShell>
    );
}
