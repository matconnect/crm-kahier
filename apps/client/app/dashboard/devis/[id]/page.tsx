import { notFound } from "next/navigation";

import { requireBillingFeature } from "@/lib/authz";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { StickyDetailHeader } from "../../_components/layout/sticky-detail-header";
import { QuoteActions } from "../_components/quote-actions";
import { QuoteForm } from "../_components/quote-form";
import { QUOTE_STATUS_OPTIONS } from "../_lib/quotes";
import { fetchQuote, fetchQuoteClients } from "../_lib/server";

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
                <QuoteForm currentUserId={currentUserId} clients={clients} quote={quote} initialPreviewOpen={query.preview === "1"} />
            </main>
        </DashboardShell>
    );
}
