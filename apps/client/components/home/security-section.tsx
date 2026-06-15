import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ROADMAP_ITEMS, SECURITY_POINTS } from "./constants";

export function SecuritySection() {
  return (
    <section id="organisation" className="py-10 md:py-12">
      <div className="mb-6 grid gap-4 lg:grid-cols-2 lg:items-end">
        <div className="space-y-2">
          <p className="text-xs uppercase  text-slate-500">Organisation</p>
          <h2 className="display-title text-2xl text-slate-950 md:text-3xl">Une structure claire pour l’équipe</h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-[1.5rem] border border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-slate-950">Organisation opérationnelle</CardTitle>
            <CardDescription className="text-slate-600">Centralisez clients et projets dans un même flux.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            {SECURITY_POINTS.map((point) => (
              <div key={point} className="rounded-xl border border-slate-200 bg-[#f7f8fc] px-4 py-3">
                {point}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border border-slate-200 bg-white shadow-none">
          <CardHeader>
            <CardTitle className="text-slate-950">Roadmap CRM</CardTitle>
            <CardDescription className="text-slate-600">On avance par modules, sans complexité inutile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            {ROADMAP_ITEMS.map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-[#f7f8fc] px-4 py-3">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
