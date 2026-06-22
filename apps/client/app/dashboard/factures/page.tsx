import Link from "next/link";
import { AlertTriangle, Banknote, CircleCheck, FileText, Plus } from "lucide-react";

import { MotionReveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../_components";
import { InvoiceTableActions } from "./_components/invoice-table-actions";
import {
    formatInvoiceDate,
    formatInvoiceMoney,
    INVOICE_STATUS_OPTIONS,
    type InvoiceStatus,
} from "./_lib/invoices";
import { fetchInvoices, fetchInvoiceSummary } from "./_lib/server";
import { InvoiceFilters } from "./_components/invoice-filters";

const STATUS_STYLES: Record<InvoiceStatus, string> = {
    DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
    SENT: "border-blue-200 bg-blue-50 text-blue-700",
    PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
    OVERDUE: "border-amber-200 bg-amber-50 text-amber-800",
    CANCELLED: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_LABELS = Object.fromEntries(INVOICE_STATUS_OPTIONS.map((status) => [status.value, status.label])) as Record<
    InvoiceStatus,
    string
>;

export default async function FacturesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>;
}) {
    const session = await requireBillingFeature("invoices_module");
    const currentUserId = session.user.id;
    const filters = await searchParams;
    const query = new URLSearchParams();
    if (filters.q?.trim()) query.set("q", filters.q.trim());
    if (filters.status?.trim()) query.set("status", filters.status.trim());
    const suffix = query.size ? `&${query.toString()}` : "";

    const [data, summary, dashboard] = await Promise.all([
        fetchInvoices(currentUserId, suffix),
        fetchInvoiceSummary(currentUserId),
        fetchDashboardData(currentUserId),
    ]);
    const invoices = data?.items ?? [];

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
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <MotionReveal>
                    <section className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <h1 className="text-2xl font-bold md:text-3xl">Factures</h1>
                            <Button asChild className="h-10 rounded-full bg-[#111322] px-4 text-white hover:bg-[#191d2e]">
                                <Link href="/dashboard/factures/new">
                                    <Plus className="h-4 w-4" />
                                    Nouvelle facture
                                </Link>
                            </Button>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: "Facturé TTC", value: formatInvoiceMoney(summary?.totalCents ?? 0), icon: FileText },
                                { label: "Encaissé", value: formatInvoiceMoney(summary?.paidCents ?? 0), icon: CircleCheck },
                                { label: "À recevoir", value: formatInvoiceMoney(summary?.outstandingCents ?? 0), icon: Banknote },
                                { label: "En retard", value: String(summary?.overdue ?? 0), icon: AlertTriangle },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="rounded-[24px] border border-white/70 bg-white p-5 shadow-sm">
                                    <Icon className="h-4 w-4 text-slate-500" />
                                    <p className="mt-4 text-sm text-slate-500">{label}</p>
                                    <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </MotionReveal>

                <MotionReveal delay={80}>
                    <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                        <InvoiceFilters initialQuery={filters.q} initialStatus={filters.status} />

                        {!data ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                                Données indisponibles.
                            </div>
                        ) : invoices.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
                                Aucune facture.
                            </div>
                        ) : (
                            <>
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-3 py-3 font-medium">Numéro</th>
                                                <th className="px-3 py-3 font-medium">Client</th>
                                                <th className="px-3 py-3 font-medium">Émission</th>
                                                <th className="px-3 py-3 font-medium">Échéance</th>
                                                <th className="px-3 py-3 font-medium">Statut</th>
                                                <th className="px-3 py-3 text-right font-medium">TTC</th>
                                                <th className="px-3 py-3 text-right font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {invoices.map((invoice) => (
                                                <tr key={invoice.id} className="transition hover:bg-slate-50">
                                                    <td className="px-3 py-4">
                                                        <Link href={`/dashboard/factures/${invoice.id}`} className="font-semibold text-slate-950">
                                                            {invoice.number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-3 py-4 text-slate-700">{invoice.client.name}</td>
                                                    <td className="px-3 py-4 text-slate-600">{formatInvoiceDate(invoice.issueDate)}</td>
                                                    <td className="px-3 py-4 text-slate-600">{formatInvoiceDate(invoice.dueDate)}</td>
                                                    <td className="px-3 py-4">
                                                        <Badge variant="outline" className={STATUS_STYLES[invoice.status]}>
                                                            {STATUS_LABELS[invoice.status]}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-3 py-4 text-right font-semibold text-slate-950">
                                                        {formatInvoiceMoney(invoice.totalCents)}
                                                    </td>
                                                    <td className="px-3 py-4">
                                                        <InvoiceTableActions
                                                            invoiceId={invoice.id}
                                                            invoiceNumber={invoice.number}
                                                            currentUserId={currentUserId}
                                                            status={invoice.status}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-3 md:hidden">
                                    {invoices.map((invoice) => (
                                        <div key={invoice.id} className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <Link href={`/dashboard/factures/${invoice.id}`} className="font-semibold text-slate-950">
                                                        {invoice.number}
                                                    </Link>
                                                    <p className="mt-1 text-sm text-slate-600">{invoice.client.name}</p>
                                                </div>
                                                <Badge variant="outline" className={STATUS_STYLES[invoice.status]}>
                                                    {STATUS_LABELS[invoice.status]}
                                                </Badge>
                                            </div>
                                            <div className="mt-4 flex items-end justify-between gap-3">
                                                <p className="text-xs text-slate-500">{formatInvoiceDate(invoice.dueDate)}</p>
                                                <p className="font-semibold text-slate-950">{formatInvoiceMoney(invoice.totalCents)}</p>
                                            </div>
                                            <div className="mt-4 border-t border-slate-100 pt-3">
                                                <InvoiceTableActions
                                                    invoiceId={invoice.id}
                                                    invoiceNumber={invoice.number}
                                                    currentUserId={currentUserId}
                                                    status={invoice.status}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                </MotionReveal>
            </main>
        </DashboardShell>
    );
}
