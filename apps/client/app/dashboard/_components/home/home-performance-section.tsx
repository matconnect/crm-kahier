import { BarChart3 } from "lucide-react";

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

function addDateToBuckets(buckets: ActivityBucket[], period: PeriodKey, dateValue: string | undefined, field: keyof Pick<ActivityBucket, "interactions" | "clients" | "projects">) {
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

export function HomePerformanceSection({ summary, interactions, clients, projects, period }: HomePerformanceSectionProps) {
    const chartData = buildActivityData(interactions, clients, projects, period);
    const maxValue = Math.max(
        1,
        ...chartData.flatMap((item) => [item.interactions, item.clients, item.projects]),
    );

    const totalRevenue = projects.reduce((sum, project) => sum + (project.revenueAmount ?? 0), 0);
    const totalInvoiced = projects.reduce((sum, project) => sum + (project.invoicedAmount ?? 0), 0);
    const hasActivity = interactions.length + clients.length + projects.length > 0;

    const stats = [
        { label: "Interactions", value: interactions.length },
        { label: "Clients", value: summary.active },
        { label: "Prospects", value: summary.prospects },
        { label: "Projets", value: projects.length },
    ];

    return (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-lg border border-[#dfe3ec] bg-white p-5 shadow-[0_16px_42px_rgba(28,35,54,0.06)] md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f0f2f7] text-[#727a8c]">
                            <BarChart3 className="h-4 w-4" />
                        </span>
                        <h2 className="text-lg font-semibold text-[#141722]">Activité CRM</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {stats.map((item) => (
                            <div key={item.label} className="rounded-lg border border-[#e4e7f2] bg-[#f8f9fd] px-3 py-2 text-right">
                                <p className="text-xl font-semibold leading-none text-[#11131d]">{item.value}</p>
                                <p className="mt-1 text-xs font-medium text-[#747b93]">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {hasActivity ? (
                    <div className="mt-8">
                        <div className="flex min-h-[300px] items-end gap-3 overflow-x-auto overflow-y-visible pb-2 pt-8">
                            {chartData.map((item) => (
                                <div key={item.key} className="group relative flex min-w-[76px] flex-col items-center gap-3">
                                    <div className="pointer-events-none absolute -top-8 left-1/2 z-20 w-max -translate-x-1/2 rounded-md bg-[#111322] px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        {item.interactions} interactions · {item.clients} clients · {item.projects} projets
                                    </div>
                                    <div className="flex h-[240px] w-full items-end justify-center gap-1 rounded-lg bg-[#f4f6fb] px-2 py-2">
                                        <div
                                            className="w-4 rounded-md bg-slate-950"
                                            style={{ height: `${Math.max(6, Math.round((item.interactions / maxValue) * 210))}px` }}
                                            aria-label={`${item.interactions} interactions`}
                                        />
                                        <div
                                            className="w-4 rounded-md bg-slate-600"
                                            style={{ height: `${Math.max(6, Math.round((item.clients / maxValue) * 210))}px` }}
                                            aria-label={`${item.clients} clients`}
                                        />
                                        <div
                                            className="w-4 rounded-md bg-slate-300"
                                            style={{ height: `${Math.max(6, Math.round((item.projects / maxValue) * 210))}px` }}
                                            aria-label={`${item.projects} projets`}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-[#747b93]">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#555c72]">
                            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-slate-950" /> Interactions</span>
                            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-slate-600" /> Clients</span>
                            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300" /> Projets</span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 rounded-lg border border-dashed border-[#d8dceb] bg-[#fafbfe] px-4 py-10 text-center text-sm font-semibold text-[#4a4f67]">
                        Aucune donnée
                    </div>
                )}
            </article>

            <div className="space-y-5">
                <article className="rounded-lg border border-[#dfe3ec] bg-white p-5 shadow-[0_16px_42px_rgba(28,35,54,0.06)] md:p-6">
                    <p className="text-sm font-semibold text-[#141722]">Chiffre d’affaires</p>
                    <p className="mt-4 text-4xl font-semibold leading-none text-[#1f2335]">{formatAmount(totalRevenue)}</p>
                </article>

                <article className="rounded-lg border border-[#dfe3ec] bg-white p-5 shadow-[0_16px_42px_rgba(28,35,54,0.06)] md:p-6">
                    <p className="text-sm font-semibold text-[#141722]">Facturé</p>
                    <p className="mt-4 text-4xl font-semibold leading-none text-[#1f2335]">{formatAmount(totalInvoiced)}</p>
                </article>
            </div>
        </section>
    );
}
