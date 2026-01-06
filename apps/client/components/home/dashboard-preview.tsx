import { Badge } from "@/components/ui/badge";

export function DashboardPreview() {
    return (
        <div className="relative">
            <div className="rounded-2xl border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="space-y-1">
                        <div className="text-sm font-medium">Aperçu Dashboard</div>
                        <div className="text-xs text-muted-foreground">Clients, projets, tâches, suivi</div>
                    </div>
                    <Badge variant="outline">Preview</Badge>
                </div>
                <div className="p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-xl border bg-muted/40 p-4">
                            <div className="text-xs text-muted-foreground">Clients</div>
                            <div className="mt-1 text-2xl font-semibold">128</div>
                            <div className="mt-3 h-2 w-full rounded bg-muted" />
                            <div className="mt-2 h-2 w-2/3 rounded bg-muted" />
                        </div>
                        <div className="rounded-xl border bg-muted/40 p-4">
                            <div className="text-xs text-muted-foreground">Projets</div>
                            <div className="mt-1 text-2xl font-semibold">24</div>
                            <div className="mt-3 h-2 w-full rounded bg-muted" />
                            <div className="mt-2 h-2 w-1/2 rounded bg-muted" />
                        </div>
                        <div className="rounded-xl border bg-muted/40 p-4 md:col-span-2">
                            <div className="text-xs text-muted-foreground">Activité récente</div>
                            <div className="mt-3 space-y-2">
                                <div className="h-3 w-full rounded bg-muted" />
                                <div className="h-3 w-5/6 rounded bg-muted" />
                                <div className="h-3 w-2/3 rounded bg-muted" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pointer-events-none absolute -right-6 -top-6 hidden h-24 w-24 rounded-3xl border bg-muted/40 md:block" />
            <div className="pointer-events-none absolute -bottom-6 -left-6 hidden h-20 w-20 rounded-3xl border bg-muted/40 md:block" />
        </div>
    );
}
