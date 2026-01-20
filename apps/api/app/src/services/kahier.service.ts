import type { KahierCategory, KahierPeriodeTab, KahierTaskPayload } from "../types/kahier.types";

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
    if (process.env.KAHIER_API_TOKEN) {
        headers.Authorization = `Bearer ${process.env.KAHIER_API_TOKEN}`;
    }
    return headers;
}

export async function getZoneData(zoneId: string) {
    const baseUrl = process.env.KAHIER_API_BASE;
    const headers = buildHeaders();

    const tabsRes = await fetch(`${baseUrl}/periodes/zone/?zoneId=${zoneId}`, { headers });

    console.log(tabsRes);

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
