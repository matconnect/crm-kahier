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
        <Card className="crm-card h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
                <div className="rounded-2xl bg-slate-950 p-2 text-amber-300 shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold text-slate-950">{value}</div>
                <CardDescription className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                    {trend} <span className="text-slate-500">· {trendLabel}</span>
                </CardDescription>
            </CardContent>
        </Card>
    );
}
