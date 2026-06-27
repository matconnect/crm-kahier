import { Activity, BriefcaseBusiness, PieChart, Users } from "lucide-react";

import type { ClientSearchItem, InteractionItem, ProjectSearchItem, SummaryResponse } from "../shared/types";

type HomeInsightsSectionProps = {
    summary: SummaryResponse;
    interactions: InteractionItem[];
    clients: ClientSearchItem[];
    projects: ProjectSearchItem[];
    period: "30d" | "90d" | "6m" | "12m" | "all";
};

type InteractionTypeGroup = {
    type: string;
    count: number;
    color: string;
};

const DONUT_COLORS = ["#111827", "#374151", "#6b7280", "#9ca3af", "#d1d5db"];
const DEFAULT_DONUT_COLOR = "#111827";

function groupByInteractionType(interactions: InteractionItem[]): InteractionTypeGroup[] {
    const map = new Map<string, number>();

    interactions.forEach((item) => {
        const key = item.badge || "Autre";
        map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
        .map(([type, count], index) => ({
            type,
            count,
            color: DONUT_COLORS[index % DONUT_COLORS.length] ?? DEFAULT_DONUT_COLOR,
        }))
        .sort((a, b) => b.count - a.count);
}

function groupProjectsByClient(projects: ProjectSearchItem[]) {
    const map = new Map<string, number>();

    projects.forEach((project) => {
        const key = project.clientName || "Sans client";
        map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
        .map(([clientName, count]) => ({ clientName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
}

function buildDonutGradient(items: InteractionTypeGroup[]) {
    if (items.length === 0) return "conic-gradient(#e5e7eb 0deg 360deg)";

    const total = items.reduce((sum, item) => sum + item.count, 0);
    let current = 0;

    const stops = items.map((item) => {
        const start = current;
        current += (item.count / total) * 360;
        return `${item.color} ${start}deg ${current}deg`;
    });

    return `conic-gradient(${stops.join(", ")})`;
}

function periodLabel(period: HomeInsightsSectionProps["period"]) {
    if (period === "30d") return "30 derniers jours";
    if (period === "90d") return "90 derniers jours";
    if (period === "6m") return "6 derniers mois";
    if (period === "12m") return "12 derniers mois";
    return "Depuis le début";
}

export function HomeInsightsSection({ interactions, clients, projects, period }: HomeInsightsSectionProps) {
    const byType = groupByInteractionType(interactions).slice(0, 5);
    const interactionTotal = byType.reduce((sum, item) => sum + item.count, 0);
    const topClients = [...clients].sort((a, b) => b.interactionsCount - a.interactionsCount).slice(0, 5);
    const projectByClient = groupProjectsByClient(projects);
    const donutGradient = buildDonutGradient(byType);
    const maxTrackedInteractions = Math.max(1, ...topClients.map((client) => client.interactionsCount));
    const maxProjectLoad = Math.max(1, ...projectByClient.map((item) => item.count));

    return (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-[24px] border border-[#dfe3ec] bg-white p-5 shadow-[0_20px_55px_rgba(28,35,54,0.08)] md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f5f7fb] text-[#111827]">
                                <PieChart className="h-4 w-4" />
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold text-[#111827]">Répartition du portefeuille</h2>
                            </div>
                        </div>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-[#e5eaf2] bg-[#f8fafc] px-3 py-1 text-xs font-semibold text-[#516076]">
                        {periodLabel(period)}
                    </span>
                </div>

                <div className="mt-6">
                    <div className="rounded-[22px] border border-[#e7ecf4] bg-[linear-gradient(180deg,#ffffff_0%,#f6f7f8_100%)] p-4 md:p-5">
                        <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white text-[#111827] shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
                                <Activity className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-[#111827]">Types d'interactions</p>
                            </div>
                        </div>

                        <div className="mt-6 grid items-center gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
                            <div className="mx-auto flex flex-col items-center">
                                <div
                                    className="grid h-[170px] w-[170px] place-items-center rounded-full"
                                    style={{ background: donutGradient }}
                                    aria-label="Répartition des interactions"
                                >
                                    <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(226,232,240,0.7)]">
                                        <span className="text-3xl font-semibold leading-none text-[#111827]">{interactionTotal}</span>
                                        <span className="text-xs font-medium text-[#667085]">interaction(s)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {byType.length === 0 ? (
                                    <p className="text-sm text-[#7d8399]">Aucune donnée</p>
                                ) : (
                                    byType.map((item) => {
                                        const share = interactionTotal > 0 ? Math.round((item.count / interactionTotal) * 100) : 0;

                                        return (
                                            <div key={item.type} className="rounded-2xl border border-white bg-white/90 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <span className="text-sm font-semibold text-[#1f2937]">{item.type}</span>
                                                    </div>
                                                    <span className="text-sm font-semibold text-[#111827]">{item.count}</span>
                                                </div>
                                                <div className="mt-2 h-2 rounded-full bg-[#e8edf5]">
                                                    <div
                                                        className="h-2 rounded-full"
                                                        style={{ width: share > 0 ? `${Math.max(10, share)}%` : "0%", backgroundColor: item.color }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            <div className="space-y-5">
                <article className="rounded-[24px] border border-[#dfe3ec] bg-white p-5 shadow-[0_20px_55px_rgba(28,35,54,0.08)] md:p-6">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3f4f6] text-[#111827]">
                            <Users className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-[#111827]">Clients les plus suivis</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-3">
                        {topClients.length === 0 ? (
                            <p className="text-sm text-[#7d8399]">Aucun client</p>
                        ) : (
                            topClients.map((client, index) => {
                                const width = Math.round((client.interactionsCount / maxTrackedInteractions) * 100);

                                return (
                                    <div key={client.id} className="rounded-[20px] border border-[#e7ecf4] bg-[#fbfcff] p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f3f4f6] text-xs font-semibold text-[#111827]">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#1f2937]">{client.name}</p>
                                                    <p className="text-xs text-[#7d8399]">{client.interactionsCount} interaction(s)</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 h-2 rounded-full bg-[#e8edf5]">
                                            <div
                                                className="h-2 rounded-full bg-[#374151]"
                                                style={{ width: width > 0 ? `${Math.max(12, width)}%` : "0%" }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </article>

                <article className="rounded-[24px] border border-[#dfe3ec] bg-white p-5 shadow-[0_20px_55px_rgba(28,35,54,0.08)] md:p-6">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#f3f4f6] text-[#111827]">
                            <BriefcaseBusiness className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-[#111827]">Charge projets</p>
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {projectByClient.length === 0 ? (
                            <p className="text-sm text-[#7d8399]">Aucun projet</p>
                        ) : (
                            projectByClient.map((item) => {
                                const width = Math.round((item.count / maxProjectLoad) * 100);

                                return (
                                    <div key={item.clientName}>
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <span className="text-sm font-semibold text-[#1f2937]">{item.clientName}</span>
                                            <span className="rounded-full bg-[#f3f4f6] px-2.5 py-1 text-xs font-semibold text-[#111827]">
                                                {item.count}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 flex-1 rounded-full bg-[#e5e7eb]">
                                                <div
                                                    className="h-2 rounded-full bg-[#6b7280]"
                                                    style={{ width: width > 0 ? `${Math.max(14, width)}%` : "0%" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </article>
            </div>
        </section>
    );
}
