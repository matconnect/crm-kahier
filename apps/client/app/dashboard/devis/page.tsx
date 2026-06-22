import Link from "next/link";
import { BadgeCheck, CircleCheck, FileText, Plus, TimerReset } from "lucide-react";

import { MotionReveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../_components";
import { QuoteFilters } from "./_components/quote-filters";
import { QuoteTableActions } from "./_components/quote-table-actions";
import { fetchQuoteSummary, fetchQuotes } from "./_lib/server";
import { formatQuoteDate, formatQuoteMoney, QUOTE_STATUS_OPTIONS, type QuoteStatus } from "./_lib/quotes";

const STATUS_STYLES: Record<QuoteStatus, string> = {
    DRAFT: "border-slate-200 bg-slate-100 text-slate-700",
    SENT: "border-blue-200 bg-blue-50 text-blue-700",
    ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    REJECTED: "border-red-200 bg-red-50 text-red-700",
    EXPIRED: "border-amber-200 bg-amber-50 text-amber-800",
    CANCELLED: "border-slate-200 bg-slate-100 text-slate-500",
};

const STATUS_LABELS = Object.fromEntries(QUOTE_STATUS_OPTIONS.map((status) => [status.value, status.label])) as Record<QuoteStatus, string>;

export default async function DevisPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>;
}) {
    const session = await requireBillingFeature("quotes_module");
    const currentUserId = session.user.id;
    const filters = await searchParams;
    const query = new URLSearchParams();
    if (filters.q?.trim()) query.set("q", filters.q.trim());
    if (filters.status?.trim()) query.set("status", filters.status.trim());
    const suffix = query.size ? `&${query.toString()}` : "";

    const [data, summary, dashboard] = await Promise.all([
        fetchQuotes(currentUserId, suffix),
        fetchQuoteSummary(currentUserId),
        fetchDashboardData(currentUserId),
    ]);
    const quotes = data?.items ?? [];

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
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <MotionReveal>
                    <section className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <h1 className="text-2xl font-bold md:text-3xl">Devis</h1>
                            <Button asChild className="h-10 rounded-full bg-[#111322] px-4 text-white hover:bg-[#191d2e]">
                                <Link href="/dashboard/devis/new">
                                    <Plus className="h-4 w-4" />
                                    Nouveau devis
                                </Link>
                            </Button>
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: "Montant proposé TTC", value: formatQuoteMoney(summary?.totalCents ?? 0), icon: FileText },
                                { label: "Acceptés", value: formatQuoteMoney(summary?.acceptedCents ?? 0), icon: BadgeCheck },
                                { label: "En attente", value: formatQuoteMoney(summary?.pendingCents ?? 0), icon: CircleCheck },
                                { label: "Expirés", value: String(summary?.expired ?? 0), icon: TimerReset },
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
                        <QuoteFilters initialQuery={filters.q} initialStatus={filters.status} />

                        {!data ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Données indisponibles.</div>
                        ) : quotes.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">Aucun devis.</div>
                        ) : (
                            <>
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-3 py-3 font-medium">Numéro</th>
                                                <th className="px-3 py-3 font-medium">Client</th>
                                                <th className="px-3 py-3 font-medium">Émission</th>
                                                <th className="px-3 py-3 font-medium">Validité</th>
                                                <th className="px-3 py-3 font-medium">Statut</th>
                                                <th className="px-3 py-3 text-right font-medium">TTC</th>
                                                <th className="px-3 py-3 text-right font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {quotes.map((quote) => (
                                                <tr key={quote.id} className="transition hover:bg-slate-50">
                                                    <td className="px-3 py-4">
                                                        <Link href={`/dashboard/devis/${quote.id}`} className="font-semibold text-slate-950">
                                                            {quote.number}
                                                        </Link>
                                                    </td>
                                                    <td className="px-3 py-4 text-slate-700">{quote.client.name}</td>
                                                    <td className="px-3 py-4 text-slate-600">{formatQuoteDate(quote.issueDate)}</td>
                                                    <td className="px-3 py-4 text-slate-600">{formatQuoteDate(quote.expiryDate)}</td>
                                                    <td className="px-3 py-4">
                                                        <Badge variant="outline" className={STATUS_STYLES[quote.status]}>
                                                            {STATUS_LABELS[quote.status]}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-3 py-4 text-right font-semibold text-slate-950">{formatQuoteMoney(quote.totalCents)}</td>
                                                    <td className="px-3 py-4">
                                                        <QuoteTableActions quoteId={quote.id} quoteNumber={quote.number} currentUserId={currentUserId} status={quote.status} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-3 md:hidden">
                                    {quotes.map((quote) => (
                                        <div key={quote.id} className="rounded-2xl border border-slate-200 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <Link href={`/dashboard/devis/${quote.id}`} className="font-semibold text-slate-950">
                                                        {quote.number}
                                                    </Link>
                                                    <p className="mt-1 text-sm text-slate-600">{quote.client.name}</p>
                                                </div>
                                                <Badge variant="outline" className={STATUS_STYLES[quote.status]}>
                                                    {STATUS_LABELS[quote.status]}
                                                </Badge>
                                            </div>
                                            <div className="mt-4 flex items-end justify-between gap-3">
                                                <p className="text-xs text-slate-500">{formatQuoteDate(quote.expiryDate)}</p>
                                                <p className="font-semibold text-slate-950">{formatQuoteMoney(quote.totalCents)}</p>
                                            </div>
                                            <div className="mt-4 border-t border-slate-100 pt-3">
                                                <QuoteTableActions quoteId={quote.id} quoteNumber={quote.number} currentUserId={currentUserId} status={quote.status} />
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
