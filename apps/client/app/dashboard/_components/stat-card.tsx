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
        <Card className="border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                <div className="rounded-lg bg-muted/70 p-2">
                    <Icon className="h-4 w-4 text-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold">{value}</div>
                <CardDescription className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                    {trend} <span className="text-muted-foreground">· {trendLabel}</span>
                </CardDescription>
            </CardContent>
        </Card>
    );
}
