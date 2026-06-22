import type { ComponentType, SVGProps } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
    label: string;
    value: string;
    trend: string;
    trendLabel: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function StatCard({ label, value, trend, trendLabel, icon: Icon }: StatCardProps) {
    return (
        <Card className="rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_42px_rgba(28,35,54,0.06)] backdrop-blur-sm transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)] h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
                <div className="rounded-2xl bg-slate-950 p-2 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold text-slate-950">{value}</div>
                <CardDescription className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                    {trend} <span className="text-slate-500">· {trendLabel}</span>
                </CardDescription>
            </CardContent>
        </Card>
    );
}
