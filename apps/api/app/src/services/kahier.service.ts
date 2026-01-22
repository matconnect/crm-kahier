import type {
    KahierCategory,
    KahierPeriodeTab,
    KahierTaskPayload,
    KahierUser,
    KahierPlanning,
    KahierLegend,
} from "../types/kahier.types";

export class KahierServiceError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

function buildHeaders(includeJson = false) {
    const headers: HeadersInit = { Accept: "application/json" };
    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }
    const apiKey = process.env.KAHIER_API_KEY ?? "0608ef3821906f5163d56f83ddf58b43ac48d45ac78b2ad924ca95a897b5de7b";
    headers["x-api-key"] = apiKey;
    return headers;
}

export async function getZoneData(zoneId: string) {
    const baseUrl = process.env.KAHIER_API_BASE;
    const headers = buildHeaders();

    const tabsRes = await fetch(`${baseUrl}/periodes/zone/?zoneId=${zoneId}`, { headers });

    if (!tabsRes.ok) {
        throw new KahierServiceError("Impossible de récupérer les onglets.", tabsRes.status);
    }

    const periodes = (await tabsRes.json()) as KahierPeriodeTab[];
    const categoriesEntries = await Promise.all(
        periodes.map(async (periode) => {
            const catRes = await fetch(`${baseUrl}/categories/${periode.id}`, { headers });
            if (!catRes.ok) return [String(periode.id), []] as const;
            const categories = (await catRes.json()) as KahierCategory[];
            return [String(periode.id), categories] as const;
        }),
    );

    return {
        periodes,
        categoriesByPeriode: Object.fromEntries(categoriesEntries),
    };
}

export async function createTask(payload: KahierTaskPayload) {
    const baseUrl = process.env.KAHIER_API_BASE;
    const headers = buildHeaders(true);
    const res = await fetch(`${baseUrl}/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de créer la tâche.", res.status);
    }

    return res.json();
}

export async function getEstablishmentUsers() {
    const baseUrl = process.env.KAHIER_API_BASE;
    const headers = buildHeaders();
    const res = await fetch(`${baseUrl}/establishments/users`, { headers });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de récupérer les utilisateurs.", res.status);
    }

    return (await res.json()) as KahierUser[];
}

export async function getPlannings() {
    const baseUrl = process.env.KAHIER_API_BASE;
    const headers = buildHeaders();
    const res = await fetch(`${baseUrl}/plannings`, { headers });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de récupérer les plannings.", res.status);
    }

    return (await res.json()) as KahierPlanning[];
}

export async function getPlanningLegends(planningId: string, mode: string) {
    const baseUrl = process.env.KAHIER_API_BASE;
    const headers = buildHeaders();
    const res = await fetch(`${baseUrl}/plannings/${planningId}/legends?mode=${encodeURIComponent(mode)}`, {
        headers,
    });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de récupérer les légendes.", res.status);
    }

    return (await res.json()) as KahierLegend[];
}

export async function createPlanningEvent(payload: Record<string, unknown>) {
    const baseUrl = process.env.KAHIER_API_BASE;
    const headers = buildHeaders(true);
    const res = await fetch(`${baseUrl}/planning`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de créer l'événement planning.", res.status);
    }

    return res.json();
}
