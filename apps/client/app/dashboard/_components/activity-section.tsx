import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { getServerApiBase } from "@/lib/api-base";

type Interaction = {
    id: string;
    type: string;
    summary: string | null;
    occurredAt: string;
    user?: { firstName: string | null; lastName: string | null; email: string | null } | null;
    collaborators?: { firstName: string | null; lastName: string | null; email: string | null }[];
    meetingStart?: string | null;
    meetingEnd?: string | null;
};

type ApiListResponse = {
    items: {
        id: string;
        name: string;
        interactions: Interaction[];
    }[];
};

export async function ActivitySection({ currentUserId }: { currentUserId: string }) {
    const apiBase = getServerApiBase();
    if (!apiBase) {
        return (
            <section id="activity" className="space-y-3 scroll-mt-26">
                <div>
                    <h2 className="text-lg font-semibold">Activités</h2>
                    <p className="text-sm text-muted-foreground">API indisponible pour le moment.</p>
                </div>
                <Card className="border-muted/60">
                    <CardContent className="p-4 text-sm text-muted-foreground">Aucune activité récente.</CardContent>
                </Card>
            </section>
        );
    }

    let data: ApiListResponse;
    try {
        const res = await fetch(`${apiBase}/clients?page=1&pageSize=10`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!res.ok) throw new Error("bad status");
        data = (await res.json()) as ApiListResponse;
    } catch {
        return (
            <section id="activity" className="space-y-3 scroll-mt-26">
                <div>
                    <h2 className="text-lg font-semibold">Activités</h2>
                    <p className="text-sm text-muted-foreground">API indisponible pour le moment.</p>
                </div>
                <Card className="border-muted/60">
                    <CardContent className="p-4 text-sm text-muted-foreground">Aucune activité récente.</CardContent>
                </Card>
            </section>
        );
    }

    const interactions = data.items
        .flatMap((client) =>
            client.interactions.map((interaction) => ({
                ...interaction,
                clientName: client.name,
            })),
        )
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
        .slice(0, 5);

    return (
        <section id="activity" className="space-y-3 scroll-mt-26">
            <div>
                <h2 className="text-lg font-semibold">Activités</h2>
                <p className="text-sm text-muted-foreground">Ce qui vient d’arriver dans vos dossiers.</p>
            </div>

            <Card className="border-muted/60">
                <CardContent className="divide-y divide-muted/80 p-0">
                    {interactions.length === 0 && (
                        <div className="px-4 py-3 text-sm text-muted-foreground">Aucune activité récente.</div>
                    )}
                    {interactions.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 px-4 py-3">
                            <div className="mt-1 rounded-lg bg-muted/70 p-2">
                                <MessageSquare className="h-4 w-4 text-foreground" />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-sm">
                                    {activity.type} · {activity.clientName}
                                </CardTitle>
                                {activity.summary && (
                                    <CardDescription className="text-xs line-clamp-2">{activity.summary}</CardDescription>
                                )}
                                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    {new Date(activity.occurredAt).toLocaleString("fr-FR")} ·{" "}
                                    {activity.user
                                        ? `${activity.user.firstName ?? ""} ${activity.user.lastName ?? ""}`.trim() ||
                                          activity.user.email ||
                                          "Utilisateur"
                                        : "Utilisateur"}
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </section>
    );
}
