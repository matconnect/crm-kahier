import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { MotionReveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
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
                <MotionReveal>
                    <section className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:flex-row md:items-center md:justify-between md:px-8">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold md:text-3xl">{invoice.number}</h1>
                                <Badge variant="outline" className="bg-white">
                                    {statusLabel}
                                </Badge>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">{invoice.client.name}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button asChild variant="outline" className="h-10 rounded-full bg-white px-4">
                                <Link href="/dashboard/factures">
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour
                                </Link>
                            </Button>
                            <InvoiceActions
                                invoiceId={invoice.id}
                                invoiceNumber={invoice.number}
                                currentUserId={currentUserId}
                                status={invoice.status}
                            />
                        </div>
                    </section>
                </MotionReveal>
                <MotionReveal delay={80}>
                    <InvoiceForm
                        currentUserId={currentUserId}
                        clients={clients}
                        invoice={invoice}
                        initialPreviewOpen={query.preview === "1"}
                    />
                </MotionReveal>
            </main>
        </DashboardShell>
    );
}
