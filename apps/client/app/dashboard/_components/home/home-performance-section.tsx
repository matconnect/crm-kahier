import { BarChart3, CircleDollarSign, Wallet } from "lucide-react";

import type { ClientSearchItem, InteractionItem, ProjectSearchItem, SummaryResponse } from "../shared/types";

type PeriodKey = "30d" | "90d" | "6m" | "12m" | "all";

type HomePerformanceSectionProps = {
    summary: SummaryResponse;
    interactions: InteractionItem[];
    clients: ClientSearchItem[];
    projects: ProjectSearchItem[];
    period: PeriodKey;
};

type ActivityBucket = {
    key: string;
    label: string;
    interactions: number;
    clients: number;
    projects: number;
};

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_HEIGHT = 220;

function getBucketCount(period: PeriodKey) {
    if (period === "30d") return 5;
    if (period === "90d") return 13;
    if (period === "6m") return 6;
    return 12;
}

function buildActivityBuckets(period: PeriodKey): ActivityBucket[] {
    const now = new Date();
    const count = getBucketCount(period);

    if (period === "30d" || period === "90d") {
        return Array.from({ length: count }, (_, index) => {
            const start = new Date(now.getTime() - (count - 1 - index) * 7 * DAY_MS);
            return {
                key: start.toISOString(),
                label: `${start.getDate().toString().padStart(2, "0")}/${(start.getMonth() + 1).toString().padStart(2, "0")}`,
                interactions: 0,
                clients: 0,
                projects: 0,
            };
        });
    }

    return Array.from({ length: count }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
        return {
            key: `${date.getFullYear()}-${date.getMonth()}`,
            label: MONTH_LABELS[date.getMonth()] ?? "",
            interactions: 0,
            clients: 0,
            projects: 0,
        };
    });
}

function addDateToBuckets(
    buckets: ActivityBucket[],
    period: PeriodKey,
    dateValue: string | undefined,
    field: keyof Pick<ActivityBucket, "interactions" | "clients" | "projects">,
) {
    if (!dateValue) return;

    const date = new Date(dateValue);
    if (!Number.isFinite(date.getTime())) return;

    if (period === "30d" || period === "90d") {
        const first = new Date(buckets[0]?.key ?? "");
        if (!Number.isFinite(first.getTime())) return;

        const index = Math.floor((date.getTime() - first.getTime()) / (7 * DAY_MS));
        const bucket = buckets[index];
        if (bucket) bucket[field] += 1;
        return;
    }

    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = buckets.find((item) => item.key === key);
    if (bucket) bucket[field] += 1;
}

function buildActivityData(
    interactions: InteractionItem[],
    clients: ClientSearchItem[],
    projects: ProjectSearchItem[],
    period: PeriodKey,
) {
    const buckets = buildActivityBuckets(period);

    interactions.forEach((item) => addDateToBuckets(buckets, period, item.occurredAt, "interactions"));
    clients.forEach((item) => addDateToBuckets(buckets, period, item.createdAt, "clients"));
    projects.forEach((item) => addDateToBuckets(buckets, period, item.createdAt ?? item.startDate ?? undefined, "projects"));

    return buckets;
}

function formatAmount(value: number) {
    return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(value: number) {
    return `${Math.round(value)}%`;
}

export function HomePerformanceSection({ summary, interactions, clients, projects, period }: HomePerformanceSectionProps) {
    const chartData = buildActivityData(interactions, clients, projects, period).map((item) => ({
        ...item,
        total: item.interactions + item.clients + item.projects,
    }));

    const maxTotal = Math.max(1, ...chartData.map((item) => item.total));
    const totalRevenue = projects.reduce((sum, project) => sum + (project.revenueAmount ?? 0), 0);
    const totalInvoiced = projects.reduce((sum, project) => sum + (project.invoicedAmount ?? 0), 0);
    const remainingRevenue = Math.max(0, totalRevenue - totalInvoiced);
    const billingCoverage = totalRevenue > 0 ? Math.min(100, (totalInvoiced / totalRevenue) * 100) : 0;
    const hasActivity = interactions.length + clients.length + projects.length > 0;

    const stats = [
        { label: "Interactions", value: interactions.length, tone: "bg-[#f3f4f6] text-[#111827]" },
        { label: "Clients actifs", value: summary.active, tone: "bg-[#f5f5f5] text-[#1f2937]" },
        { label: "Prospects", value: summary.prospects, tone: "bg-[#fafafa] text-[#374151]" },
        { label: "Projets", value: projects.length, tone: "bg-[#ededed] text-[#111827]" },
    ];

    return (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <article className="overflow-hidden rounded-[24px] border border-[#dfe3ec] bg-white shadow-[0_20px_55px_rgba(28,35,54,0.08)]">
                <div className="border-b border-[#edf1f7] bg-[linear-gradient(135deg,#ffffff_0%,#f7f7f8_55%,#efeff1_100%)] px-5 py-5 md:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-3">
                                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-[#111827] shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                                    <BarChart3 className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-lg font-semibold text-[#111827]">Activité dans le temps</h2>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {stats.map((item) => (
                            <div key={item.label} className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.tone}`}>
                                    {item.label}
                                </span>
                                <p className="mt-3 text-3xl font-semibold text-[#111827]">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {hasActivity ? (
                    <div className="px-5 py-6 md:px-6">
                        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#5f677b]">
                            <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#111827]" />
                                Interactions
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#4b5563]" />
                                Clients
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#9ca3af]" />
                                Projets
                            </span>
                        </div>

                        <div className="flex gap-4 overflow-x-auto pb-1">
                            {chartData.map((item) => {
                                const interactionHeight = item.interactions > 0 ? Math.max(8, Math.round((item.interactions / maxTotal) * CHART_HEIGHT)) : 0;
                                const clientHeight = item.clients > 0 ? Math.max(8, Math.round((item.clients / maxTotal) * CHART_HEIGHT)) : 0;
                                const projectHeight = item.projects > 0 ? Math.max(8, Math.round((item.projects / maxTotal) * CHART_HEIGHT)) : 0;
                                const totalHeight = Math.max(12, interactionHeight + clientHeight + projectHeight);

                                return (
                                    <div key={item.key} className="group flex min-w-[84px] flex-1 flex-col items-center">
                                        <div className="mb-3 rounded-full border border-[#e7ecf4] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#475569]">
                                            {item.total}
                                        </div>

                                        <div className="relative flex h-[280px] w-full items-end justify-center rounded-[22px] border border-[#eef2f7] bg-[linear-gradient(180deg,#fbfdff_0%,#f4f8fc_100%)] px-3 py-3">
                                            <div className="pointer-events-none absolute inset-x-3 bottom-[calc(50%+12px)] border-t border-dashed border-[#d7e0eb]" />
                                            <div className="pointer-events-none absolute inset-x-3 bottom-3 border-t border-dashed border-[#d7e0eb]" />

                                            <div className="absolute left-1/2 top-3 z-20 w-max -translate-x-1/2 rounded-xl bg-[#0f172a] px-3 py-2 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                                {item.interactions} interactions · {item.clients} clients · {item.projects} projets
                                            </div>

                                            <div
                                                className="flex w-full max-w-[46px] flex-col justify-end overflow-hidden rounded-[18px] bg-white shadow-[inset_0_0_0_1px_rgba(226,232,240,0.9)]"
                                                style={{ height: `${totalHeight}px` }}
                                                aria-label={`${item.label}: ${item.total} elements`}
                                            >
                                                {item.projects > 0 ? <div className="w-full bg-[#9ca3af]" style={{ height: `${projectHeight}px` }} /> : null}
                                                {item.clients > 0 ? <div className="w-full bg-[#4b5563]" style={{ height: `${clientHeight}px` }} /> : null}
                                                {item.interactions > 0 ? <div className="w-full bg-[#111827]" style={{ height: `${interactionHeight}px` }} /> : null}
                                            </div>
                                        </div>

                                        <span className="mt-3 text-xs font-semibold text-[#475569]">{item.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="px-5 py-10 md:px-6">
                        <div className="rounded-[22px] border border-dashed border-[#d8dceb] bg-[#fafbfe] px-4 py-10 text-center text-sm font-semibold text-[#4a4f67]">
                            Aucune donnée
                        </div>
                    </div>
                )}
            </article>

            <div className="space-y-5">
                <article className="rounded-[24px] border border-[#dfe3ec] bg-white p-5 shadow-[0_20px_55px_rgba(28,35,54,0.08)] md:p-6">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3f4f6] text-[#111827]">
                            <CircleDollarSign className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-[#111827]">Chiffre d'affaires projeté</p>
                        </div>
                    </div>

                    <p className="mt-5 text-4xl font-semibold leading-none text-[#111827]">{formatAmount(totalRevenue)}</p>

                    <div className="mt-5 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-[#3f4a5f]">Reste à facturer</span>
                            <span className="font-semibold text-[#111827]">{formatAmount(remainingRevenue)}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-[#e5e7eb]">
                            <div
                                className="h-2 rounded-full bg-[#111827]"
                                style={{ width: totalRevenue > 0 ? `${Math.max(4, billingCoverage)}%` : "0%" }}
                            />
                        </div>
                    </div>
                </article>

                <article className="rounded-[24px] border border-[#dfe3ec] bg-white p-5 shadow-[0_20px_55px_rgba(28,35,54,0.08)] md:p-6">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3f4f6] text-[#111827]">
                            <Wallet className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-[#111827]">Facturation encaissée</p>
                        </div>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-3">
                        <p className="text-4xl font-semibold leading-none text-[#111827]">{formatAmount(totalInvoiced)}</p>
                        <span className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-semibold text-[#111827]">
                            {formatPercent(billingCoverage)}
                        </span>
                    </div>

                    <div className="mt-5 rounded-2xl border border-[#e5e7eb] bg-[#f9fafb] p-4">
                        <div className="flex items-center justify-between text-sm text-[#516076]">
                            <span>Taux de facturation</span>
                            <span className="font-semibold text-[#111827]">{formatPercent(billingCoverage)}</span>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-[#e5e7eb]">
                            <div
                                className="h-2 rounded-full bg-[#374151]"
                                style={{ width: totalRevenue > 0 ? `${Math.max(4, billingCoverage)}%` : "0%" }}
                            />
                        </div>
                    </div>
                </article>
            </div>
        </section>
    );
}
