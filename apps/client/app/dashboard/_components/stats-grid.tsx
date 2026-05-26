"use client";

import { useMemo, useState } from "react";
import { Handshake, Mail, ShieldCheck, Users } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { StatCard } from "./stat-card";

type PeriodKey = "7j" | "30j";

type PeriodData = {
    label: string;
    clients: number;
    prevClients: number;
    prospects: number;
    prevProspects: number;
    interactions: number;
    prevInteractions: number;
};

type Props = {
    periods: Record<PeriodKey, PeriodData>;
};

function formatDelta(current: number, previous: number) {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const pct = Math.round(((current - previous) / previous) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}%`;
}

export function StatsGrid({ periods }: Props) {
    const [period, setPeriod] = useState<PeriodKey>("7j");
    const data = periods[period];

    const stats = useMemo(
        () => [
            {
                label: `Nouveaux clients (${period})`,
                value: String(data.clients),
                trend: formatDelta(data.clients, data.prevClients),
                trendLabel: period === "7j" ? "vs semaine dernière" : "vs mois dernier",
                icon: ShieldCheck,
            },
            {
                label: `Prospects (${period})`,
                value: String(data.prospects),
                trend: formatDelta(data.prospects, data.prevProspects),
                trendLabel: period === "7j" ? "vs semaine dernière" : "vs mois dernier",
                icon: Users,
            },
            {
                label: `Interactions (${period})`,
                value: String(data.interactions),
                trend: formatDelta(data.interactions, data.prevInteractions),
                trendLabel: period === "7j" ? "vs semaine dernière" : "vs mois dernier",
                icon: Mail,
            },
            {
                label: "Interactions / client",
                value: data.clients > 0 ? (data.interactions / data.clients).toFixed(1) : "0",
                trend: formatDelta(
                    data.clients > 0 ? data.interactions / data.clients : 0,
                    data.prevClients > 0 ? data.prevInteractions / data.prevClients : 0,
                ),
                trendLabel: period === "7j" ? "vs semaine dernière" : "vs mois dernier",
                icon: Handshake,
            },
        ],
        [data, period],
    );

    return (
        <div className="space-y-3">
            <div className="flex justify-end">
                <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
                    <SelectTrigger className="w-[200px] rounded-full border-slate-200 bg-white/75">
                        <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7j">7 derniers jours</SelectItem>
                        <SelectItem value="30j">30 derniers jours</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard key={stat.label} {...stat} />
                ))}
            </div>
        </div>
    );
}
