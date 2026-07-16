import { notFound } from "next/navigation";

import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { StickyDetailHeader } from "../../_components/layout/sticky-detail-header";
import { InvoiceActions } from "../_components/invoice-actions";
import { InvoiceForm } from "../_components/invoice-form";
import { INVOICE_STATUS_OPTIONS } from "../_lib/invoices";
import { fetchInvoice, fetchInvoiceClients } from "../_lib/server";

function formatAddress(parts: Array<string | null | undefined>) {
    return parts
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter(Boolean)
        .join(", ");
}

function PartyCard({
    title,
    lines,
}: {
    title: string;
    lines: Array<string | null | undefined>;
}) {
    return (
        <article className="rounded-[24px] border border-slate-200 bg-[#fafbff] p-5 shadow-[0_16px_40px_rgba(29,33,49,0.05)]">
            <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
            <div className="mt-4 space-y-1.5">
                {lines.filter(Boolean).length ? (
                    lines
                        .filter((line): line is string => Boolean(line))
                        .map((line, index) => (
                            <p key={`${title}-${index}`} className={index === 0 ? "text-lg font-semibold text-slate-950" : "text-sm text-slate-600"}>
                                {line}
                            </p>
                        ))
                ) : (
                    <p className="text-sm text-slate-400">Informations à compléter</p>
                )}
            </div>
        </article>
    );
}

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
                <section className="grid gap-4 lg:grid-cols-2">
                    <PartyCard
                        title="Émis par"
                        lines={[
                            invoice.company.name,
                            formatAddress([
                                invoice.company.addressLine1,
                                invoice.company.addressLine2,
                                formatAddress([invoice.company.postalCode, invoice.company.city, invoice.company.country]),
                            ]),
                            invoice.company.contactEmail,
                            invoice.company.contactPhone,
                        ]}
                    />
                    <PartyCard
                        title="Destinataire"
                        lines={[
                            invoice.client.name,
                            formatAddress([
                                invoice.client.addressLine1,
                                invoice.client.addressLine2,
                                formatAddress([invoice.client.postalCode, invoice.client.city, invoice.client.country]),
                            ]),
                            invoice.client.primaryEmail,
                            invoice.client.primaryPhone,
                        ]}
                    />
                </section>
                <InvoiceForm currentUserId={currentUserId} clients={clients} invoice={invoice} initialPreviewOpen={query.preview === "1"} />
            </main>
        </DashboardShell>
    );
}
