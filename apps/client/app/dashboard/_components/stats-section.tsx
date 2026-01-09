import { StatsGrid } from "./stats-grid";

export async function StatsSection({ currentUserId }: { currentUserId: string }) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
        throw new Error("NEXT_PUBLIC_API_URL manquant pour récupérer les statistiques");
    }

    const res = await fetch(`${apiBase}/clients/summary`, {
        cache: "no-store",
        headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
    });
    if (!res.ok) {
        throw new Error("Impossible de récupérer les statistiques clients");
    }

    const summary = (await res.json()) as {
        total: number;
        active: number;
        inactive: number;
        prospects: number;
        interactions: number;
        interactionsWeek: number;
        interactionsPrevWeek: number;
        interactionsMonth: number;
        interactionsPrevMonth: number;
        clientsWeek: number;
        clientsPrevWeek: number;
        clientsMonth: number;
        clientsPrevMonth: number;
        prospectsWeek: number;
        prospectsPrevWeek: number;
        prospectsMonth: number;
        prospectsPrevMonth: number;
    };

    const periods = {
        "7j": {
            label: "7 derniers jours",
            clients: summary.clientsWeek,
            prevClients: summary.clientsPrevWeek,
            prospects: summary.prospectsWeek,
            prevProspects: summary.prospectsPrevWeek,
            interactions: summary.interactionsWeek,
            prevInteractions: summary.interactionsPrevWeek,
        },
        "30j": {
            label: "30 derniers jours",
            clients: summary.clientsMonth,
            prevClients: summary.clientsPrevMonth,
            prospects: summary.prospectsMonth,
            prevProspects: summary.prospectsPrevMonth,
            interactions: summary.interactionsMonth,
            prevInteractions: summary.interactionsPrevMonth,
        },
    };

    return (
        <section id="stats" className="space-y-3 scroll-mt-26">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Vue d’ensemble</h2>
                    <p className="text-sm text-muted-foreground">Chiffres clés de vos clients et de vos activités.</p>
                </div>
            </div>

            <StatsGrid periods={periods} />
        </section>
    );
}
