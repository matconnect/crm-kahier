import type { ProjectSearchItem, SummaryResponse } from "../shared/types";

type HomePerformanceSectionProps = {
    summary: SummaryResponse;
    projects: ProjectSearchItem[];
    period: "30d" | "90d" | "6m" | "12m" | "all";
};

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

type ChartBucket = {
    label: string;
    starts: number;
    deadlines: number;
};

function getTrend(value: number) {
    const rounded = Math.round(value);
    const clamped = Math.min(999, Math.abs(rounded));
    return `${rounded >= 0 ? "+" : "-"}${clamped}%`;
}

function calculateWindowTrendFromDates(dates: string[], windowDays: number) {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const currentStart = now - windowDays * dayMs;
    const previousStart = now - windowDays * 2 * dayMs;

    const currentCount = dates.filter((value) => {
        const time = new Date(value).getTime();
        return Number.isFinite(time) && time >= currentStart;
    }).length;

    const previousCount = dates.filter((value) => {
        const time = new Date(value).getTime();
        return Number.isFinite(time) && time >= previousStart && time < currentStart;
    }).length;

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    return ((currentCount - previousCount) / previousCount) * 100;
}

function formatPeriodLabel(period: HomePerformanceSectionProps["period"]) {
    if (period === "30d") return "30 derniers jours";
    if (period === "90d") return "90 derniers jours";
    if (period === "6m") return "6 mois";
    if (period === "12m") return "12 mois";
    return "Depuis le début";
}

function buildChartData(projects: ProjectSearchItem[], period: HomePerformanceSectionProps["period"]) {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    const addByWeek = (days: number, weeks: number): ChartBucket[] => {
        const buckets = Array.from({ length: weeks }, (_, index) => ({
            label: `S${index + 1}`,
            starts: 0,
            deadlines: 0,
        }));
        const rangeStart = now.getTime() - days * dayMs;

        projects.forEach((project) => {
            const startTime = project.startDate ? new Date(project.startDate).getTime() : NaN;
            if (Number.isFinite(startTime) && startTime >= rangeStart) {
                const offset = Math.min(days - 1, Math.max(0, Math.floor((now.getTime() - startTime) / dayMs)));
                const weekIndex = weeks - 1 - Math.floor(offset / 7);
                const bucket = buckets[weekIndex];
                if (bucket) bucket.starts += 1;
            }

            const endTime = project.endDate ? new Date(project.endDate).getTime() : NaN;
            if (Number.isFinite(endTime) && endTime >= rangeStart) {
                const offset = Math.min(days - 1, Math.max(0, Math.floor((now.getTime() - endTime) / dayMs)));
                const weekIndex = weeks - 1 - Math.floor(offset / 7);
                const bucket = buckets[weekIndex];
                if (bucket) bucket.deadlines += 1;
            }
        });

        return buckets;
    };

    if (period === "30d") return addByWeek(30, 4);
    if (period === "90d") return addByWeek(90, 13);

    const monthCount = period === "6m" ? 6 : 12;
    const buckets = Array.from({ length: monthCount }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1 - index), 1);
        return {
            label: MONTH_LABELS[date.getMonth()],
            starts: 0,
            deadlines: 0,
            year: date.getFullYear(),
            monthIndex: date.getMonth(),
        };
    });

    projects.forEach((project) => {
        if (project.startDate) {
            const date = new Date(project.startDate);
            if (Number.isFinite(date.getTime())) {
                const bucket = buckets.find((b) => b.year === date.getFullYear() && b.monthIndex === date.getMonth());
                if (bucket) bucket.starts += 1;
            }
        }

        if (project.endDate) {
            const date = new Date(project.endDate);
            if (Number.isFinite(date.getTime())) {
                const bucket = buckets.find((b) => b.year === date.getFullYear() && b.monthIndex === date.getMonth());
                if (bucket) bucket.deadlines += 1;
            }
        }
    });

    return buckets.map(({ label, starts, deadlines }) => ({ label, starts, deadlines }));
}

export function HomePerformanceSection({ summary, projects, period }: HomePerformanceSectionProps) {
    const chartData = buildChartData(projects, period);
    const maxValue = Math.max(...chartData.map((item) => item.starts + item.deadlines), 1);

    const startsCount = projects.filter((project) => Boolean(project.startDate)).length;
    const deadlinesCount = projects.filter((project) => Boolean(project.endDate)).length;
    const activeClientsAndProspects = summary.active + summary.prospects;

    const windowDays = period === "30d" ? 30 : period === "90d" ? 90 : period === "6m" ? 180 : 365;
    const startDates = projects.map((project) => project.startDate).filter((value): value is string => Boolean(value));
    const endDates = projects.map((project) => project.endDate).filter((value): value is string => Boolean(value));
    const startsTrend = calculateWindowTrendFromDates(startDates, windowDays);
    const deadlinesTrend = calculateWindowTrendFromDates(endDates, windowDays);

    return (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <article className="rounded-[28px] border border-white/70 bg-[#f8f9fd] p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-[38px] font-bold leading-none ">Performance d’équipe</h2>
                        <p className="mt-1 text-xs font-medium text-[#8f93a9]">
                            Basé sur les dates de projets (démarrages et échéances)
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#6f7488]">
                        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#2f9e95]" /> Démarrages</span>
                        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-[#d6e7e5]" /> Échéances</span>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-[#d8dceb] bg-white/55 px-4 py-10 text-center">
                        <p className="text-sm font-semibold text-[#4a4f67]">Aucun projet planifié pour cette période.</p>
                        <p className="mt-1 text-xs text-[#8f93a9]">Ajoute des dates de démarrage ou d’échéance sur tes projets pour alimenter ce graphique.</p>
                    </div>
                ) : (
                    <div className="mt-8 flex items-end gap-2 overflow-x-auto overflow-y-visible pb-1 pt-16">
                        {chartData.map((item) => {
                            const startsHeight = Math.max(18, Math.round((item.starts / maxValue) * 290));
                            const deadlinesHeight = Math.max(18, Math.round((item.deadlines / maxValue) * 120));
                            return (
                                <div
                                    key={item.label}
                                    className="group relative flex min-w-[58px] flex-col items-center gap-2"
                                    aria-label={`${item.label}: ${item.starts} démarrages et ${item.deadlines} échéances`}
                                >
                                    <div className="pointer-events-none absolute -top-14 left-1/2 z-20 w-max -translate-x-1/2 rounded-md bg-[#111322] px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                        {item.label} · {item.starts} démarrages · {item.deadlines} échéances
                                    </div>
                                    <div className="flex w-full flex-col justify-end rounded-2xl bg-[#eef2fa] p-1">
                                        <div className="w-full rounded-xl bg-[#2f9e95]" style={{ height: `${startsHeight}px` }} />
                                        <div className="mt-1 w-full rounded-xl bg-[#d6e7e5]" style={{ height: `${deadlinesHeight}px` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-[#747b93]">{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </article>

            <div className="space-y-5">
                <article className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                    <p className="text-xs uppercase  text-[#8f93a9]">Démarrages planifiés</p>
                    <p className="mt-3 text-6xl font-black leading-none text-[#1f2335]">{startsCount}</p>
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#efe9ff] px-3 py-1 text-sm font-semibold text-[#6a42db]">
                        {getTrend(startsTrend)} · {formatPeriodLabel(period)}
                    </p>
                </article>

                <article className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                    <p className="text-xs uppercase  text-[#8f93a9]">Échéances planifiées</p>
                    <p className="mt-3 text-6xl font-black leading-none text-[#1f2335]">{deadlinesCount}</p>
                    <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#e7f7ef] px-3 py-1 text-sm font-semibold text-[#1d8b5e]">
                        {getTrend(deadlinesTrend)} · Base portefeuille {activeClientsAndProspects}
                    </p>
                </article>
            </div>
        </section>
    );
}
