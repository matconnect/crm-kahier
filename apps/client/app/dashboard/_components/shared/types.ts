export type ApiInteraction = {
    id: string;
    type: string;
    summary: string | null;
    occurredAt: string;
};

export type ApiListResponse = {
    items: {
        id: string;
        name: string;
        status?: string;
        createdAt?: string;
        interactions: ApiInteraction[];
    }[];
};

export type ApiProjectsResponse = {
    items: {
        id: string;
        name: string;
        description?: string | null;
        createdAt?: string;
        budgetAmount?: number | null;
        revenueAmount?: number | null;
        invoicedAmount?: number | null;
        startDate?: string | null;
        endDate?: string | null;
        client?: { id: string; name: string } | null;
    }[];
};

export type SummaryResponse = {
    active: number;
    prospects: number;
    interactions: number;
    interactionsMonth?: number;
    interactionsPrevMonth?: number;
};

export type InteractionItem = {
    id: string;
    clientId: string;
    clientName: string;
    summary: string;
    occurredAt: string;
    badge: string;
    type: string;
};

export type ClientSearchItem = {
    id: string;
    name: string;
    interactionsCount: number;
    status?: string;
    createdAt?: string;
};

export type ProjectSearchItem = {
    id: string;
    name: string;
    description: string;
    clientName: string;
    createdAt?: string;
    budgetAmount?: number | null;
    revenueAmount?: number | null;
    invoicedAmount?: number | null;
    startDate?: string | null;
    endDate?: string | null;
};

export function getInteractionBadge(type: string) {
    const normalized = type.toLowerCase();
    if (normalized.includes("appel") || normalized.includes("call")) return "Appel";
    if (normalized.includes("meeting") || normalized.includes("rdv")) return "Rdv";
    if (normalized.includes("email") || normalized.includes("mail")) return "Email";
    return "Échange";
}
