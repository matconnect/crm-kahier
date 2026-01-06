import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { TASKS } from "./constants";

export function TasksSection() {
    return (
        <section id="tasks" className="space-y-3 scroll-mt-26">
            <div>
                <h2 className="text-lg font-semibold">Tâches</h2>
                <p className="text-sm text-muted-foreground">Ce qui doit bouger en priorité.</p>
            </div>

            <Card className="border-muted/60">
                <CardHeader>
                    <CardTitle className="text-sm">Priorités</CardTitle>
                    <CardDescription>Toutes les actions à venir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {TASKS.map((task) => (
                        <div key={task.title} className="flex items-center justify-between rounded-lg border border-dashed border-muted px-3 py-2">
                            <div>
                                <div className="text-sm font-medium">{task.title}</div>
                                <div className="text-xs text-muted-foreground">Assignée à {task.owner}</div>
                            </div>
                            <Badge variant="secondary">{task.due}</Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </section>
    );
}
