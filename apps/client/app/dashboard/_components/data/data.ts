import { getServerApiBase } from "@/lib/api-base";

import { getInteractionBadge } from "../shared/types";
import type {
    ApiListResponse,
    ApiProjectsResponse,
    ClientSearchItem,
    InteractionItem,
    ProjectSearchItem,
    SummaryResponse,
} from "../shared/types";

export async function fetchDashboardData(currentUserId: string) {
    const apiBase = getServerApiBase();

    const summary: SummaryResponse = {
        active: 0,
        prospects: 0,
        interactions: 0,
    };

    let interactions: InteractionItem[] = [];
    let clients: ClientSearchItem[] = [];
    let projects: ProjectSearchItem[] = [];

    if (!apiBase) {
        return { summary, interactions, clients, projects };
    }

    try {
        const [summaryRes, activityRes, projectsRes] = await Promise.all([
            fetch(`${apiBase}/clients/summary`, {
                cache: "no-store",
                headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
            }),
            fetch(`${apiBase}/clients?page=1&pageSize=200`, {
                cache: "no-store",
                headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
            }),
            fetch(`${apiBase}/projects?page=1&pageSize=200`, {
                cache: "no-store",
                headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
            }),
        ]);

        if (summaryRes.ok) {
            const payload = (await summaryRes.json()) as SummaryResponse;
            summary.active = payload.active;
            summary.prospects = payload.prospects;
            summary.interactions = payload.interactions;
        }

        if (activityRes.ok) {
            const payload = (await activityRes.json()) as ApiListResponse;
            clients = payload.items.map((client) => ({
                id: client.id,
                name: client.name,
                interactionsCount: client.interactions.length,
                status: client.status,
                createdAt: client.createdAt,
            }));
            interactions = payload.items
                .flatMap((client) =>
                    client.interactions.map((interaction) => ({
                        id: interaction.id,
                        clientId: client.id,
                        clientName: client.name,
                        summary: interaction.summary?.trim() || `${interaction.type} enregistré.`,
                        occurredAt: interaction.occurredAt,
                        badge: getInteractionBadge(interaction.type),
                        type: interaction.type,
                    })),
                    )
                .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
                .slice(0, 200);
        }

        if (projectsRes.ok) {
            const payload = (await projectsRes.json()) as ApiProjectsResponse;
            projects = (payload.items ?? []).map((project) => ({
                id: project.id,
                name: project.name,
                description: project.description?.trim() || "",
                clientName: project.client?.name || "Sans client",
                createdAt: project.createdAt,
                budgetAmount: project.budgetAmount ?? null,
                revenueAmount: project.revenueAmount ?? null,
                invoicedAmount: project.invoicedAmount ?? null,
                startDate: project.startDate ?? null,
                endDate: project.endDate ?? null,
            }));
        }
    } catch {
        // Keep fallback values when API is unreachable.
    }

    return { summary, interactions, clients, projects };
}
