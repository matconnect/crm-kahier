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

const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

function buildHeaders(includeJson = false) {
    const headers: HeadersInit = { Accept: "application/json" };
    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }
    const apiKey = requireEnv("KAHIER_API_KEY");
    headers["x-api-key"] = apiKey;
    return headers;
}

export async function getZoneData(zoneId: string) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
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
    const baseUrl = requireEnv("KAHIER_API_BASE");
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
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders();
    const res = await fetch(`${baseUrl}/establishments/users`, { headers });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de récupérer les utilisateurs.", res.status);
    }

    return (await res.json()) as KahierUser[];
}

export async function getPlannings() {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders();
    const res = await fetch(`${baseUrl}/plannings`, { headers });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de récupérer les plannings.", res.status);
    }

    return (await res.json()) as KahierPlanning[];
}

export async function getPlanningLegends(planningId: string, mode: string) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
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
    const baseUrl = requireEnv("KAHIER_API_BASE");
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
