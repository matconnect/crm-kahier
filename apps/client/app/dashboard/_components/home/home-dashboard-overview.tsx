"use client";

import { useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientSearchItem, InteractionItem, ProjectSearchItem, SummaryResponse } from "../shared/types";
import { HomeInsightsSection } from "./home-insights-section";
import { HomePerformanceSection } from "./home-performance-section";

type PeriodKey = "30d" | "90d" | "6m" | "12m" | "all";

type HomeDashboardOverviewProps = {
    summary: SummaryResponse;
    interactions: InteractionItem[];
    clients: ClientSearchItem[];
    projects: ProjectSearchItem[];
};

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
    { key: "30d", label: "30 derniers jours" },
    { key: "90d", label: "90 derniers jours" },
    { key: "6m", label: "6 mois" },
    { key: "12m", label: "12 mois" },
    { key: "all", label: "Depuis le début" },
];

function getStartDate(period: PeriodKey) {
    if (period === "all") return null;

    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (period === "30d") start.setDate(start.getDate() - 30);
    if (period === "90d") start.setDate(start.getDate() - 90);
    if (period === "6m") start.setMonth(start.getMonth() - 6);
    if (period === "12m") start.setFullYear(start.getFullYear() - 1);

    return start;
}

function isWithinPeriod(dateValue: string | undefined, periodStart: Date | null) {
    if (!periodStart) return true;
    if (!dateValue) return false;
    const time = new Date(dateValue).getTime();
    return Number.isFinite(time) && time >= periodStart.getTime();
}

export function HomeDashboardOverview({ summary, interactions, clients, projects }: HomeDashboardOverviewProps) {
    const [period, setPeriod] = useState<PeriodKey>("30d");

    const periodStart = useMemo(() => getStartDate(period), [period]);

    const filteredInteractions = useMemo(
        () => interactions.filter((item) => isWithinPeriod(item.occurredAt, periodStart)),
        [interactions, periodStart],
    );

    const filteredClients = useMemo(() => {
        const interactionsCountByClient = new Map<string, number>();
        filteredInteractions.forEach((item) => {
            interactionsCountByClient.set(item.clientId, (interactionsCountByClient.get(item.clientId) ?? 0) + 1);
        });

        if (period === "all") {
            return clients.map((client) => ({
                ...client,
                interactionsCount: interactionsCountByClient.get(client.id) ?? client.interactionsCount,
            }));
        }

        return clients
            .filter((client) => isWithinPeriod(client.createdAt, periodStart) || interactionsCountByClient.has(client.id))
            .map((client) => ({
                ...client,
                interactionsCount: interactionsCountByClient.get(client.id) ?? 0,
            }));
    }, [clients, filteredInteractions, period, periodStart]);

    const filteredProjects = useMemo(() => {
        if (period === "all") return projects;
        return projects.filter(
            (project) =>
                isWithinPeriod(project.createdAt, periodStart) ||
                isWithinPeriod(project.startDate ?? undefined, periodStart) ||
                isWithinPeriod(project.endDate ?? undefined, periodStart),
        );
    }, [period, periodStart, projects]);

    const filteredSummary = useMemo(() => {
        if (period === "all") {
            return {
                ...summary,
                interactions: filteredInteractions.length,
            };
        }

        const activeCount = filteredClients.filter((client) => (client.status ?? "").toUpperCase() === "ACTIVE").length;
        const prospectsCount = filteredClients.filter((client) => (client.status ?? "").toUpperCase() === "PROSPECT").length;

        return {
            ...summary,
            active: activeCount,
            prospects: prospectsCount,
            interactions: filteredInteractions.length,
        };
    }, [filteredClients, filteredInteractions.length, period, summary]);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-semibold text-[#11131d]">Tableau de bord</h1>
                <label className="inline-flex items-center gap-2 rounded-lg border border-[#dfe3ec] bg-white px-3 py-2 text-sm font-semibold text-[#434965] shadow-[0_8px_22px_rgba(28,35,54,0.04)]">
                    <Select value={period} onValueChange={(value) => setPeriod(value as PeriodKey)}>
                        <SelectTrigger className="h-8 w-[170px] border-0 bg-white px-0 text-[#2f3344] shadow-none">
                            <SelectValue placeholder="Choisir la période" />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIOD_OPTIONS.map((option) => (
                                <SelectItem key={option.key} value={option.key}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </label>
            </div>

            <HomePerformanceSection
                summary={filteredSummary}
                interactions={filteredInteractions}
                clients={filteredClients}
                projects={filteredProjects}
                period={period}
            />
            <HomeInsightsSection
                summary={filteredSummary}
                interactions={filteredInteractions}
                clients={filteredClients}
                projects={filteredProjects}
                period={period}
            />
        </div>
    );
}
