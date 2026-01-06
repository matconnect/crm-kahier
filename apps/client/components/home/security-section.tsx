import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { ROADMAP_ITEMS, SECURITY_POINTS } from "./constants";

export function SecuritySection() {
    return (
        <section id="organisation" className="py-14 md:py-18">
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-muted/60">
                    <CardHeader>
                        <CardTitle>Organisation opérationnelle</CardTitle>
                        <CardDescription>Centralisez clients et projets dans un même flux.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <ul className="list-inside list-disc space-y-2">
                            {SECURITY_POINTS.map((point) => (
                                <li key={point}>{point}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border-muted/60">
                    <CardHeader>
                        <CardTitle>Roadmap CRM</CardTitle>
                        <CardDescription>On avance par modules, sans complexité inutile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <ul className="list-inside list-disc space-y-2">
                            {ROADMAP_ITEMS.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}
