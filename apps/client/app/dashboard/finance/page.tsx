import { Banknote, HandCoins, Info, ReceiptText, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { getServerApiBase } from "@/lib/api-base";
import { requireBillingFeature } from "@/lib/authz";
import { getRevenueSourceLabel, type RevenueSource } from "@/lib/client-enums";
import { MotionReveal } from "@/components/motion/reveal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DashboardShell, fetchDashboardData } from "../_components";

type ProjectItem = {
    id: string;
    name: string;
    status: "DRAFT" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
    revenueAmount: number | null;
    costAmount: number | null;
    invoicedAmount: number | null;
    receivedAmount: number | null;
    client: { id: string; name: string } | null;
};

type ClientItem = {
    id: string;
    revenueSource: RevenueSource | null;
};

type ProjectsResponse = {
    items: ProjectItem[];
};

type ClientsResponse = {
    items: ClientItem[];
};

type RevenueSourceBreakdown = {
    source: RevenueSource;
    label: string;
    projects: number;
    revenue: number;
    cost: number;
};

const CURRENCY = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

async function fetchProjects(apiBase: string, currentUserId: string): Promise<ProjectsResponse | null> {
    try {
        const response = await fetch(`${apiBase}/projects?page=1&pageSize=300`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!response.ok) return null;
        return (await response.json()) as ProjectsResponse;
    } catch {
        return null;
    }
}

async function fetchClients(apiBase: string, currentUserId: string): Promise<ClientsResponse | null> {
    try {
        const response = await fetch(`${apiBase}/clients?page=1&pageSize=300`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!response.ok) return null;
        return (await response.json()) as ClientsResponse;
    } catch {
        return null;
    }
}

function formatAmount(value: number) {
    return CURRENCY.format(value);
}

function formatPercent(value: number) {
    if (!Number.isFinite(value)) return "0%";
    return `${value.toFixed(1)}%`;
}

function formatCompactNumber(value: number) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value);
}

function FormulaPopover({ content }: { content: string }) {
    return (
        <Popover>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#d7dced] bg-white text-[#747c92] transition hover:border-[#c4cbdb] hover:text-[#1e2234]"
                            aria-label="Voir le calcul"
                        >
                            <Info className="h-3.5 w-3.5" />
                        </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 rounded-2xl border-[#e2e6f0] p-3 text-sm text-[#4f566b]">
                {content}
            </PopoverContent>
        </Popover>
    );
}

function buildRevenueBreakdown(projects: ProjectItem[], clients: ClientItem[]): RevenueSourceBreakdown[] {
    const sourceByClientId = new Map(clients.map((client) => [client.id, client.revenueSource ?? "OTHER"]));
    const buckets = new Map<RevenueSource, RevenueSourceBreakdown>();

    const seedSources: RevenueSource[] = ["REFERRAL", "OUTBOUND", "ADS", "PARTNER", "UPSELL", "OTHER"];
    seedSources.forEach((source) =>
        buckets.set(source, {
            source,
            label: getRevenueSourceLabel(source),
            projects: 0,
            revenue: 0,
            cost: 0,
        }),
    );

    projects.forEach((project) => {
        const source = (project.client?.id ? sourceByClientId.get(project.client.id) : null) ?? "OTHER";
        const bucket = buckets.get(source);
        if (!bucket) return;
        bucket.projects += 1;
        bucket.revenue += project.revenueAmount ?? 0;
        bucket.cost += project.costAmount ?? 0;
    });

    return Array.from(buckets.values()).sort((a, b) => b.revenue - a.revenue);
}

export default async function FinancePage() {
    const session = await requireBillingFeature("finance_dashboard");
    const currentUserId = session.user?.id ?? "";
    const firstName = session.user?.firstName?.trim() || "équipe";
    const apiBase = getServerApiBase();
    const dashboardData = await fetchDashboardData(currentUserId);

    const [projectsData, clientsData] = apiBase
        ? await Promise.all([fetchProjects(apiBase, currentUserId), fetchClients(apiBase, currentUserId)])
        : [null, null];

    const projects = projectsData?.items ?? [];
    const clients = clientsData?.items ?? [];

    const plannedRevenue = projects.reduce((sum, project) => sum + (project.revenueAmount ?? 0), 0);
    const plannedCost = projects.reduce((sum, project) => sum + (project.costAmount ?? 0), 0);
    const plannedMargin = plannedRevenue - plannedCost;
    const marginRate = plannedRevenue > 0 ? (plannedMargin / plannedRevenue) * 100 : 0;

    const invoiced = projects.reduce((sum, project) => sum + (project.invoicedAmount ?? 0), 0);
    const received = projects.reduce((sum, project) => sum + (project.receivedAmount ?? 0), 0);
    const outstanding = invoiced - received;

    const activeProjects = projects.filter((project) => project.status !== "COMPLETED").length;
    const averageRevenue = projects.length > 0 ? plannedRevenue / projects.length : 0;
    const averageMargin = projects.length > 0 ? plannedMargin / projects.length : 0;
    const collectionRate = invoiced > 0 ? (received / invoiced) * 100 : 0;
    const hasApiIssue = !apiBase || projectsData === null || clientsData === null;

    const revenueBreakdown = buildRevenueBreakdown(projects, clients);
    const topSourceRevenue = revenueBreakdown[0]?.revenue ?? 0;
    const sourceItems = revenueBreakdown.map((item) => ({
        ...item,
        share: topSourceRevenue > 0 ? (item.revenue / topSourceRevenue) * 100 : item.projects > 0 ? 100 : 0,
    }));
    const flowItems = [
        { label: "Prévu", value: plannedRevenue, tone: "bg-[#1f2434]" },
        { label: "Facturé", value: invoiced, tone: "bg-[#4b5568]" },
        { label: "Encaissé", value: received, tone: "bg-[#7c869b]" },
        { label: "Reste", value: outstanding, tone: "bg-[#c8ceda]" },
    ].map((item) => ({
        ...item,
        width: plannedRevenue > 0 ? (item.value / plannedRevenue) * 100 : 0,
    }));

    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={dashboardData.summary}
            interactionsCount={dashboardData.interactions.length}
            activeMenu="finance"
            searchClients={dashboardData.clients}
            searchInteractions={dashboardData.interactions}
            searchProjects={dashboardData.projects}
        >
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <MotionReveal>
                    <section className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-2xl font-bold md:text-3xl">Finance</h1>
                        </div>

                        <div className="mt-6 grid gap-2 sm:gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_20px_50px_rgba(29,33,49,0.08)] sm:p-5">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] uppercase text-[#8f93a9] sm:text-xs">Revenu prévisionnel</p>
                                    <FormulaPopover content="Somme de tous les montants de revenu renseignés sur les projets." />
                                </div>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-2xl">{formatAmount(plannedRevenue)}</p>
                            </div>
                            <div className="rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_20px_50px_rgba(29,33,49,0.08)] sm:p-5">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] uppercase text-[#8f93a9] sm:text-xs">Coût projet</p>
                                    <FormulaPopover content="Somme de tous les coûts renseignés sur les projets." />
                                </div>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-2xl">{formatAmount(plannedCost)}</p>
                            </div>
                            <div className="rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_20px_50px_rgba(29,33,49,0.08)] sm:p-5">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[11px] uppercase text-[#8f93a9] sm:text-xs">Marge estimée</p>
                                    <FormulaPopover content="Marge estimée = revenu prévisionnel moins coût projet. Le taux de marge = marge estimée / revenu prévisionnel." />
                                </div>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-2xl">{formatAmount(plannedMargin)}</p>
                                <p className="mt-1 text-xs text-[#6f7488]">Taux de marge: {formatPercent(marginRate)}</p>
                            </div>
                            <div className="rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_20px_50px_rgba(29,33,49,0.08)] sm:p-5">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <ReceiptText className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <p className="text-[11px] uppercase text-[#8f93a9] sm:text-xs">Facturé</p>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-2xl">{formatAmount(invoiced)}</p>
                            </div>
                            <div className="rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_20px_50px_rgba(29,33,49,0.08)] sm:p-5">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <HandCoins className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <p className="text-[11px] uppercase text-[#8f93a9] sm:text-xs">Encaissé</p>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-2xl">{formatAmount(received)}</p>
                            </div>
                            <div className="rounded-[28px] border border-white/70 bg-white p-3 shadow-[0_20px_50px_rgba(29,33,49,0.08)] sm:p-5">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <Banknote className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <p className="text-[11px] uppercase text-[#8f93a9] sm:text-xs">Reste à encaisser</p>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-2xl">{formatAmount(outstanding)}</p>
                                <p className="mt-1 text-xs text-[#6f7488]">{activeProjects} projet(s) actif(s)</p>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-2 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[24px] border border-white/70 bg-white/80 px-3 py-3 sm:px-4 sm:py-4">
                                <p className="text-[10px] uppercase text-[#8f93a9] sm:text-[11px]">Encaissement</p>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-xl">{formatPercent(collectionRate)}</p>
                            </div>
                            <div className="rounded-[24px] border border-white/70 bg-white/80 px-3 py-3 sm:px-4 sm:py-4">
                                <p className="text-[10px] uppercase text-[#8f93a9] sm:text-[11px]">Ticket moyen</p>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-xl">{formatAmount(averageRevenue)}</p>
                            </div>
                            <div className="rounded-[24px] border border-white/70 bg-white/80 px-3 py-3 sm:px-4 sm:py-4">
                                <p className="text-[10px] uppercase text-[#8f93a9] sm:text-[11px]">Marge moyenne</p>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-xl">{formatAmount(averageMargin)}</p>
                            </div>
                            <div className="rounded-[24px] border border-white/70 bg-white/80 px-3 py-3 sm:px-4 sm:py-4">
                                <p className="text-[10px] uppercase text-[#8f93a9] sm:text-[11px]">Actifs</p>
                                <p className="mt-2 text-lg font-semibold text-[#1e2234] sm:text-xl">{formatCompactNumber(activeProjects)}</p>
                            </div>
                        </div>
                    </section>
                </MotionReveal>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <MotionReveal delay={70}>
                        <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                            <h2 className="text-2xl font-semibold text-slate-950">Sources</h2>

                            {hasApiIssue ? (
                                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                                    Données indisponibles.
                                </div>
                            ) : revenueBreakdown.every((item) => item.revenue <= 0 && item.cost <= 0 && item.projects === 0) ? (
                                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                                    Aucune donnée.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sourceItems.map((item) => (
                                        <div key={item.source} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-sm font-semibold text-slate-950">{item.label}</p>
                                                <p className="text-sm font-semibold text-slate-950">{formatAmount(item.revenue)}</p>
                                            </div>
                                            <div className="mt-3 h-2 rounded-full bg-white">
                                                <div
                                                    className="h-2 rounded-full bg-[#1f2434]"
                                                    style={{ width: `${Math.max(item.share, item.projects > 0 ? 8 : 0)}%` }}
                                                />
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                                <span>{formatCompactNumber(item.projects)}</span>
                                                <span>{formatAmount(item.cost)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </MotionReveal>

                    <MotionReveal delay={120}>
                        <aside className="xl:sticky xl:top-28">
                            <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <h2 className="text-2xl font-semibold text-slate-950">Flux</h2>
                                <div className="mt-4 space-y-3">
                                    {flowItems.map((item) => (
                                        <div key={item.label} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                                                <p className="text-sm font-semibold text-slate-950">{formatAmount(item.value)}</p>
                                            </div>
                                            <div className="mt-3 h-2 rounded-full bg-white">
                                                <div className={`h-2 rounded-full ${item.tone}`} style={{ width: `${Math.max(item.width, item.value > 0 ? 8 : 0)}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </aside>
                    </MotionReveal>
                </div>
            </main>
        </DashboardShell>
    );
}
