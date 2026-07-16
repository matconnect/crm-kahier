import { notFound } from "next/navigation";

import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { StickyDetailHeader } from "../../_components/layout/sticky-detail-header";
import { QuoteActions } from "../_components/quote-actions";
import { QuoteForm } from "../_components/quote-form";
import { QUOTE_STATUS_OPTIONS } from "../_lib/quotes";
import { fetchQuote, fetchQuoteClients } from "../_lib/server";

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

export default async function QuoteDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ preview?: string }>;
}) {
    const session = await requireBillingFeature("quotes_module");
    const currentUserId = session.user.id;
    const [{ id }, query] = await Promise.all([params, searchParams]);
    const [quote, clients, dashboard] = await Promise.all([
        fetchQuote(id, currentUserId),
        fetchQuoteClients(currentUserId),
        fetchDashboardData(currentUserId),
    ]);
    if (!quote) notFound();
    const statusLabel = QUOTE_STATUS_OPTIONS.find((status) => status.value === quote.status)?.label ?? quote.status;

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
                {quote.storedStatus !== "DRAFT" ? (
                    <StickyDetailHeader
                        title={quote.number}
                        subtitle={quote.client.name}
                        badgeLabel={statusLabel}
                        returnHref="/dashboard/devis"
                        returnLabel="Retour"
                        actions={<QuoteActions quoteId={quote.id} quoteNumber={quote.number} currentUserId={currentUserId} status={quote.status} />}
                    />
                ) : null}
                <section className="grid gap-4 lg:grid-cols-2">
                    <PartyCard
                        title="Émis par"
                        lines={[
                            quote.company.name,
                            formatAddress([
                                quote.company.addressLine1,
                                quote.company.addressLine2,
                                formatAddress([quote.company.postalCode, quote.company.city, quote.company.country]),
                            ]),
                            quote.company.contactEmail,
                            quote.company.contactPhone,
                        ]}
                    />
                    <PartyCard
                        title="Destinataire"
                        lines={[
                            quote.client.name,
                            formatAddress([
                                quote.client.addressLine1,
                                quote.client.addressLine2,
                                formatAddress([quote.client.postalCode, quote.client.city, quote.client.country]),
                            ]),
                            quote.client.primaryEmail,
                            quote.client.primaryPhone,
                        ]}
                    />
                </section>
                <QuoteForm currentUserId={currentUserId} clients={clients} quote={quote} initialPreviewOpen={query.preview === "1"} />
            </main>
        </DashboardShell>
    );
}
