import type { ClientSearchItem, InteractionItem, ProjectSearchItem, SummaryResponse } from "../shared/types";

type HomeInsightsSectionProps = {
    summary: SummaryResponse;
    interactions: InteractionItem[];
    clients: ClientSearchItem[];
    projects: ProjectSearchItem[];
    period: "30d" | "90d" | "6m" | "12m" | "all";
};

type WeekBucket = {
    label: string;
    value: number;
};

function toMonday(date: Date) {
    const value = new Date(date);
    const day = value.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    value.setHours(0, 0, 0, 0);
    value.setDate(value.getDate() + diff);
    return value;
}

function getWeeksCount(period: HomeInsightsSectionProps["period"]) {
    if (period === "30d") return 4;
    if (period === "90d") return 13;
    if (period === "6m") return 26;
    if (period === "12m") return 52;
    return 52;
}

function buildWeeklyBuckets(interactions: InteractionItem[], period: HomeInsightsSectionProps["period"]) {
    const weeksCount = getWeeksCount(period);
    const today = new Date();
    const currentMonday = toMonday(today);
    const firstWeekStart = new Date(currentMonday);
    firstWeekStart.setDate(currentMonday.getDate() - (weeksCount - 1) * 7);
    const buckets: WeekBucket[] = Array.from({ length: weeksCount }, (_, index) => {
        const weekStart = new Date(currentMonday);
        weekStart.setDate(currentMonday.getDate() - (weeksCount - 1 - index) * 7);
        return {
            label: `${weekStart.getDate().toString().padStart(2, "0")}/${(weekStart.getMonth() + 1).toString().padStart(2, "0")}`,
            value: 0,
        };
    });

    interactions.forEach((item) => {
        const date = new Date(item.occurredAt);
        if (Number.isNaN(date.getTime())) return;
        const monday = toMonday(date);
        const diffWeeks = Math.floor((monday.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (diffWeeks < 0 || diffWeeks >= buckets.length) return;
        const bucket = buckets[diffWeeks];
        if (!bucket) return;
        bucket.value += 1;
    });

    return buckets;
}

function groupByInteractionType(interactions: InteractionItem[]) {
    const map = new Map<string, number>();
    interactions.forEach((item) => {
        const key = item.badge || "Autre";
        map.set(key, (map.get(key) ?? 0) + 1);
    });

    return Array.from(map.entries())
        .map(([type, count]) => ({ type, count }))
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

function getConversionRate(active: number, prospects: number) {
    const base = active + prospects;
    if (base <= 0) return 0;
    return Math.round((active / base) * 100);
}

function cadenceLabel(period: HomeInsightsSectionProps["period"]) {
    if (period === "30d") return "Cadence interactions (4 semaines)";
    if (period === "90d") return "Cadence interactions (13 semaines)";
    if (period === "6m") return "Cadence interactions (26 semaines)";
    if (period === "12m") return "Cadence interactions (52 semaines)";
    return "Cadence interactions (52 semaines)";
}

export function HomeInsightsSection({ summary, interactions, clients, projects, period }: HomeInsightsSectionProps) {
    const weekly = buildWeeklyBuckets(interactions, period);
    const maxWeekly = Math.max(1, ...weekly.map((item) => item.value));
    const byType = groupByInteractionType(interactions);
    const typeTotal = byType.reduce((sum, item) => sum + item.count, 0);
    const topClients = [...clients].sort((a, b) => b.interactionsCount - a.interactionsCount).slice(0, 5);
    const projectByClient = groupProjectsByClient(projects);
    const conversionRate = getConversionRate(summary.active, summary.prospects);

    return (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-[#e4e7f2] bg-[#f8f9fd] p-4">
                        <p className="text-xs uppercase  text-[#8f93a9]">Clients actifs</p>
                        <p className="mt-2 text-3xl font-black text-[#1f2335]">{summary.active}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e4e7f2] bg-[#f8f9fd] p-4">
                        <p className="text-xs uppercase  text-[#8f93a9]">Prospects</p>
                        <p className="mt-2 text-3xl font-black text-[#1f2335]">{summary.prospects}</p>
                    </div>
                    <div className="rounded-2xl border border-[#e4e7f2] bg-[#f8f9fd] p-4">
                        <p className="text-xs uppercase  text-[#8f93a9]">Taux conversion</p>
                        <p className="mt-2 text-3xl font-black text-[#1f2335]">{conversionRate}%</p>
                    </div>
                    <div className="rounded-2xl border border-[#e4e7f2] bg-[#f8f9fd] p-4">
                        <p className="text-xs uppercase  text-[#8f93a9]">Projets suivis</p>
                        <p className="mt-2 text-3xl font-black text-[#1f2335]">{projects.length}</p>
                    </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#e4e7f2] bg-[#f8f9fd] p-4">
                        <p className="text-xs uppercase  text-[#8f93a9]">{cadenceLabel(period)}</p>
                        <div className="mt-4 flex items-end gap-2 overflow-x-auto overflow-y-visible pb-1 pt-12">
                            {weekly.map((item) => (
                                <div
                                    key={item.label}
                                    className="group relative flex min-w-[52px] flex-col items-center gap-2"
                                    aria-label={`Semaine du ${item.label}: ${item.value} interactions`}
                                >
                                    <div className="pointer-events-none absolute -top-10 left-1/2 z-20 w-max -translate-x-1/2 rounded-md bg-[#111322] px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        {item.label} · {item.value} interaction(s)
                                    </div>
                                    <div className="flex h-[170px] w-full items-end rounded-xl bg-[#edf0f7] p-1">
                                        <div
                                            className="w-full rounded-lg bg-[#2f9e95]"
                                            style={{ height: `${Math.max(10, Math.round((item.value / maxWeekly) * 150))}px` }}
                                        />
                                    </div>
                                    <span className="text-xs font-semibold text-[#747b93]">{item.label}</span>
                                    <span className="text-xs text-[#8f93a9]">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#e4e7f2] bg-[#f8f9fd] p-4">
                        <p className="text-xs uppercase  text-[#8f93a9]">Répartition des interactions</p>
                        <div className="mt-4 space-y-3">
                            {byType.length === 0 ? (
                                <p className="text-sm text-[#7d8399]">Pas encore de données disponibles.</p>
                            ) : (
                                byType.slice(0, 5).map((item) => {
                                    const width = typeTotal > 0 ? Math.max(8, Math.round((item.count / typeTotal) * 100)) : 0;
                                    return (
                                        <div key={item.type}>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-semibold text-[#2f3344]">{item.type}</span>
                                                <span className="text-[#6f7488]">{item.count}</span>
                                            </div>
                                            <div className="mt-1 h-2 rounded-full bg-[#e5e8f1]">
                                                <div className="h-2 rounded-full bg-[#6a42db]" style={{ width: `${width}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </article>

            <div className="space-y-5">
                <article className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                    <p className="text-xs uppercase  text-[#8f93a9]">Top clients engagés</p>
                    <div className="mt-4 space-y-3">
                        {topClients.length === 0 ? (
                            <p className="text-sm text-[#7d8399]">Aucun client avec interactions pour le moment.</p>
                        ) : (
                            topClients.map((client) => (
                                <div key={client.id} className="rounded-xl border border-[#e4e7f2] bg-[#f8f9fd] px-3 py-2">
                                    <p className="text-sm font-semibold text-[#2f3344]">{client.name}</p>
                                    <p className="text-xs text-[#7d8399]">{client.interactionsCount} interaction(s)</p>
                                </div>
                            ))
                        )}
                    </div>
                </article>

                <article className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                    <p className="text-xs uppercase  text-[#8f93a9]">Charge projets par client</p>
                    <div className="mt-4 space-y-3">
                        {projectByClient.length === 0 ? (
                            <p className="text-sm text-[#7d8399]">Aucun projet enregistré pour l’instant.</p>
                        ) : (
                            projectByClient.map((item) => (
                                <div key={item.clientName}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-semibold text-[#2f3344]">{item.clientName}</span>
                                        <span className="text-[#6f7488]">{item.count}</span>
                                    </div>
                                    <div className="mt-1 h-2 rounded-full bg-[#e5e8f1]">
                                        <div
                                            className="h-2 rounded-full bg-[#2f9e95]"
                                            style={{ width: `${Math.max(12, Math.round((item.count / Math.max(1, projects.length)) * 100))}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </article>
            </div>
        </section>
    );
}
