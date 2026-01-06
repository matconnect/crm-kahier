import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type FeatureCardProps = {
    icon: ReactNode;
    title: string;
    desc: string;
};

export function FeatureCard({ icon, title, desc }: FeatureCardProps) {
    return (
        <Card className="border-muted/60">
            <CardHeader className="space-y-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-muted/40">{icon}</div>
                <div className="space-y-1">
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardDescription>{desc}</CardDescription>
                </div>
            </CardHeader>
            <CardContent />
        </Card>
    );
}
