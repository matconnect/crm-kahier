import { notFound } from "next/navigation";

import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { StickyDetailHeader } from "../../_components/layout/sticky-detail-header";
import { InvoiceActions } from "../_components/invoice-actions";
import { InvoiceForm } from "../_components/invoice-form";
import { INVOICE_STATUS_OPTIONS } from "../_lib/invoices";
import { fetchInvoice, fetchInvoiceClients } from "../_lib/server";

export default async function InvoiceDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ preview?: string }>;
}) {
    const session = await requireBillingFeature("invoices_module");
    const currentUserId = session.user.id;
    const [{ id }, query] = await Promise.all([params, searchParams]);
    const [invoice, clients, dashboard] = await Promise.all([
        fetchInvoice(id, currentUserId),
        fetchInvoiceClients(currentUserId),
        fetchDashboardData(currentUserId),
    ]);
    if (!invoice) notFound();
    const statusLabel = INVOICE_STATUS_OPTIONS.find((status) => status.value === invoice.status)?.label ?? invoice.status;

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
                {invoice.storedStatus !== "DRAFT" ? (
                    <StickyDetailHeader
                        title={invoice.number}
                        subtitle={invoice.client.name}
                        badgeLabel={statusLabel}
                        returnHref="/dashboard/factures"
                        returnLabel="Retour"
                        actions={
                            <InvoiceActions
                                invoiceId={invoice.id}
                                invoiceNumber={invoice.number}
                                currentUserId={currentUserId}
                                status={invoice.status}
                            />
                        }
                    />
                ) : null}
                <InvoiceForm currentUserId={currentUserId} clients={clients} invoice={invoice} initialPreviewOpen={query.preview === "1"} />
            </main>
        </DashboardShell>
    );
}
