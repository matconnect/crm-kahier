import type { ReactNode } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  desc: string;
};

export function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <Card className="rounded-[1.5rem] border border-slate-200 bg-white shadow-none">
      <CardHeader className="space-y-3">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-[#f3f4fa] text-slate-700">
          {icon}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-base text-slate-950">{title}</CardTitle>
          <CardDescription className="text-slate-600">{desc}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
