import Link from "next/link";
import { ArrowUpRight, Banknote, CircleDollarSign, HandCoins, ReceiptText, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { getServerApiBase } from "@/lib/api-base";
import { requireBillingFeature } from "@/lib/authz";
import { getRevenueSourceLabel, type RevenueSource } from "@/lib/client-enums";
import { MotionReveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";

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
    const hasApiIssue = !apiBase || projectsData === null || clientsData === null;

    const topProjects = [...projects]
        .map((project) => ({
            ...project,
            margin: (project.revenueAmount ?? 0) - (project.costAmount ?? 0),
            outstanding: (project.invoicedAmount ?? 0) - (project.receivedAmount ?? 0),
        }))
        .sort((a, b) => b.margin - a.margin)
        .slice(0, 8);

    const outstandingProjects = [...projects]
        .map((project) => ({
            ...project,
            outstanding: (project.invoicedAmount ?? 0) - (project.receivedAmount ?? 0),
        }))
        .filter((project) => project.outstanding > 0)
        .sort((a, b) => b.outstanding - a.outstanding)
        .slice(0, 8);

    const revenueBreakdown = buildRevenueBreakdown(projects, clients);

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
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-8">
                <MotionReveal>
                    <section className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-8 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#e1e4ef] bg-white px-3 py-1 text-xs text-[#6f7488]">
                                    Vue finance
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Connecté : {session.user?.email}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Finance</h1>
                                    <p className="text-sm text-[#6f7488]">
                                        Suivi consolidé des revenus, coûts, marges et encaissements du portefeuille projet.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/projects/new"
                                    className="inline-flex items-center gap-2 rounded-full bg-[#111322] px-4 py-2 text-sm font-medium text-white"
                                >
                                    <CircleDollarSign className="h-4 w-4" />
                                    Nouveau projet
                                </Link>
                                <Link
                                    href="/dashboard/projects"
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 py-2 text-sm font-medium text-[#2f3344]"
                                >
                                    Voir les projets
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Revenu prévisionnel</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1e2234]">{formatAmount(plannedRevenue)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <TrendingDown className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Coût projet</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1e2234]">{formatAmount(plannedCost)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Marge estimée</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1e2234]">{formatAmount(plannedMargin)}</p>
                                <p className="mt-1 text-xs text-[#6f7488]">Taux de marge: {formatPercent(marginRate)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <ReceiptText className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Facturé</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1e2234]">{formatAmount(invoiced)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <HandCoins className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Encaissé</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1e2234]">{formatAmount(received)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <Banknote className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Reste à encaisser</p>
                                <p className="mt-2 text-2xl font-semibold text-[#1e2234]">{formatAmount(outstanding)}</p>
                                <p className="mt-1 text-xs text-[#6f7488]">{activeProjects} projet(s) actif(s)</p>
                            </div>
                        </div>
                    </section>
                </MotionReveal>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <MotionReveal delay={70}>
                        <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <p className="section-kicker">Marge projet</p>
                                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">Top rentabilité</h2>
                                </div>
                                <Badge variant="secondary" className="border border-[#d7dced] bg-[#f7f8fc] text-[#2f3344]">
                                    {projects.length} projets
                                </Badge>
                            </div>

                            {hasApiIssue ? (
                                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                                    Les données finance ne sont pas disponibles pour le moment.
                                </div>
                            ) : topProjects.length === 0 ? (
                                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                                    Aucun projet avec données financières pour l’instant.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topProjects.map((project) => (
                                        <Link
                                            key={project.id}
                                            href={`/dashboard/projects/${project.id}`}
                                            className="block rounded-[1.25rem] border border-slate-200 bg-white p-4 transition hover:border-slate-300"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-950">{project.name}</p>
                                                    <p className="text-xs text-slate-500">{project.client?.name ?? "Sans client"}</p>
                                                </div>
                                                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                                    {formatAmount(project.margin)}
                                                </Badge>
                                            </div>
                                            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                                <p>Revenu: <span className="font-medium text-slate-900">{formatAmount(project.revenueAmount ?? 0)}</span></p>
                                                <p>Coût: <span className="font-medium text-slate-900">{formatAmount(project.costAmount ?? 0)}</span></p>
                                                <p>Reste: <span className="font-medium text-slate-900">{formatAmount(project.outstanding)}</span></p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </section>
                    </MotionReveal>

                    <MotionReveal delay={120}>
                        <aside className="space-y-6 xl:sticky xl:top-28">
                            <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <p className="section-kicker">Origine revenu</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Sources</h2>
                                <div className="mt-4 space-y-3">
                                    {revenueBreakdown.map((item) => (
                                        <div key={item.source} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-slate-950">{item.label}</p>
                                                <p className="text-xs text-slate-500">{item.projects} projet(s)</p>
                                            </div>
                                            <p className="mt-2 text-sm text-slate-700">
                                                {formatAmount(item.revenue)} revenu · {formatAmount(item.cost)} coût
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <p className="section-kicker">Risque cash</p>
                                <h2 className="mt-2 text-2xl font-semibold text-slate-950">À encaisser</h2>
                                <div className="mt-4 space-y-3">
                                    {outstandingProjects.length === 0 ? (
                                        <p className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-sm text-slate-600">
                                            Aucun reste à encaisser détecté.
                                        </p>
                                    ) : (
                                        outstandingProjects.map((project) => (
                                            <Link
                                                key={project.id}
                                                href={`/dashboard/projects/${project.id}`}
                                                className="block rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
                                            >
                                                <p className="text-sm font-medium text-slate-950">{project.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">{project.client?.name ?? "Sans client"}</p>
                                                <p className="mt-2 text-sm font-semibold text-slate-900">{formatAmount(project.outstanding)}</p>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </section>
                        </aside>
                    </MotionReveal>
                </div>
            </main>
        </DashboardShell>
    );
}
