import type {
    KahierCategory,
    KahierCreateCategoryPayload,
    KahierCreateTabPayload,
    KahierPeriodeTab,
    KahierSetTaskCompletionPayload,
    KahierTaskPayload,
    KahierUser,
    KahierPlanning,
    KahierLegend,
    KahierCreateLegendPayload,
    KahierUpdateCategoryPayload,
    KahierTask,
} from "../types/kahier.types.js";
import { readFileSync } from "node:fs";

export class KahierServiceError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function extractUpstreamError(res: Response): Promise<string> {
    try {
        const raw = await res.text();
        if (!raw.trim()) return `Erreur upstream (${res.status})`;
        try {
            const parsed = JSON.parse(raw) as { error?: string; message?: string };
            return parsed.error?.trim() || parsed.message?.trim() || raw.slice(0, 300);
        } catch {
            return raw.slice(0, 300);
        }
    } catch {
        return `Erreur upstream (${res.status})`;
    }
}

const fromEnvOrFile = (name: string): string | undefined => {
    const value = process.env[name];
    if (value && value.trim()) {
        return value.trim();
    }

    const filePath = process.env[`${name}_FILE`];
    if (filePath && filePath.trim()) {
        return readFileSync(filePath.trim(), "utf8").trim();
    }

    return undefined;
};

const requireEnv = (name: string): string => {
    const value = fromEnvOrFile(name);
    if (!value) {
        throw new Error(`Missing required environment variable: ${name} or ${name}_FILE`);
    }
    return value;
};

function buildHeaders(includeJson = false, apiKeyOverride?: string | null) {
    const headers: HeadersInit = { Accept: "application/json" };
    if (includeJson) {
        headers["Content-Type"] = "application/json";
    }
    const apiKey = apiKeyOverride?.trim() || fromEnvOrFile("KAHIER_API_KEY");
    if (!apiKey) {
        throw new KahierServiceError("Clé API Kahier manquante.", 400);
    }
    headers["x-api-key"] = apiKey;
    return headers;
}

export async function getZoneData(zoneId: string, apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(false, apiKey);

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

export async function createTask(payload: KahierTaskPayload, apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(true, apiKey);
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

export async function getEstablishmentUsers(apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(false, apiKey);
    const res = await fetch(`${baseUrl}/establishments/users`, { headers });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de récupérer les utilisateurs.", res.status);
    }

    return (await res.json()) as KahierUser[];
}

export async function getPlannings(apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(false, apiKey);
    const res = await fetch(`${baseUrl}/plannings`, { headers });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de récupérer les plannings.", res.status);
    }

    return (await res.json()) as KahierPlanning[];
}

export async function getPlanningLegends(planningId: string, mode: string, apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(false, apiKey);
    const res = await fetch(`${baseUrl}/plannings/${planningId}/legends?mode=${encodeURIComponent(mode)}`, {
        headers,
    });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de récupérer les légendes.", res.status);
    }

    return (await res.json()) as KahierLegend[];
}

export async function createPlanningEvent(payload: Record<string, unknown>, apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(true, apiKey);
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

export async function createPlanningLegend(payload: KahierCreateLegendPayload, apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(true, apiKey);
    const res = await fetch(`${baseUrl}/planning/color`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            label: payload.label,
            color: payload.color,
            selectedPlanningId: payload.selectedPlanningId,
            agenda_principal: payload.agenda_principal ?? true,
        }),
    });

    if (!res.ok) {
        throw new KahierServiceError("Impossible de créer la légende.", res.status);
    }

    return (await res.json()) as KahierLegend;
}

export async function getApiKeyScopes(apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(false, apiKey);
    const scopesUrl = new URL("/api/establishments/api-keys/scopes", baseUrl).toString();
    const res = await fetch(scopesUrl, { headers });

    if (!res.ok) {
        const details = await extractUpstreamError(res);
        throw new KahierServiceError(`Impossible de récupérer les scopes. ${details}`, res.status);
    }

    return (await res.json()) as {
        scopes: { id: number; label: string; description: string; scopes: string[] }[];
    };
}

export async function createPeriodeTab(payload: KahierCreateTabPayload, apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(true, apiKey);
    const res = await fetch(`${baseUrl}/periodes`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            label: payload.name,
            zoneId: payload.zoneId,
            isGeneral: false,
        }),
    });

    if (!res.ok) {
        const details = await extractUpstreamError(res);
        throw new KahierServiceError(`Impossible de créer l'onglet. ${details}`, res.status);
    }

    return (await res.json()) as KahierPeriodeTab;
}

export async function createCategoryTab(payload: KahierCreateCategoryPayload, apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(true, apiKey);
    const res = await fetch(`${baseUrl}/categories`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            name: payload.name,
            periodeTabId: payload.tabId,
            displayOrder: 9999,
            assignedUserIds: [],
        }),
    });

    if (!res.ok) {
        const details = await extractUpstreamError(res);
        throw new KahierServiceError(`Impossible de créer la catégorie. ${details}`, res.status);
    }

    return (await res.json()) as KahierCategory;
}

export async function updateCategoryLink(
    categoryId: number,
    payload: KahierUpdateCategoryPayload,
    apiKey?: string | null,
) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(true, apiKey);
    const categoriesRes = await fetch(`${baseUrl}/categories/${payload.periodeTabId}`, {
        headers: buildHeaders(false, apiKey),
    });

    if (!categoriesRes.ok) {
        const details = await extractUpstreamError(categoriesRes);
        throw new KahierServiceError(`Impossible de charger la catégorie Kahier. ${details}`, categoriesRes.status);
    }

    const categories = (await categoriesRes.json()) as KahierCategory[];
    const currentCategory = categories.find((category) => category.id === categoryId);

    if (!currentCategory) {
        throw new KahierServiceError("Catégorie introuvable", 404);
    }

    const res = await fetch(`${baseUrl}/categories/${categoryId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
            id: currentCategory.id,
            name: currentCategory.name,
            caseNumber: currentCategory.caseNumber ?? null,
            clientName: currentCategory.clientName ?? null,
            departureCode: currentCategory.departureCode ?? null,
            arrivalCode: currentCategory.arrivalCode ?? null,
            recurrenceDate: currentCategory.recurrenceDate ?? null,
            deadlineDate: currentCategory.deadlineDate ?? null,
            displayOrder: currentCategory.displayOrder,
            periodeTabId: currentCategory.periodeTabId,
            crmProjectId: payload.crmProjectId,
            crmProjectName: payload.crmProjectName,
            color: currentCategory.color ?? null,
            assignedUserIds: Array.isArray(currentCategory.assignedUsers)
                ? currentCategory.assignedUsers.map((user) => user.id)
                : [],
        }),
    });

    if (!res.ok) {
        const details = await extractUpstreamError(res);
        throw new KahierServiceError(`Impossible de mettre à jour la catégorie. ${details}`, res.status);
    }

    return (await res.json()) as KahierCategory;
}

export async function getCategoryTasks(categoryId: number, periodeTabId: number, apiKey?: string | null) {
    const baseUrl = requireEnv("KAHIER_API_BASE");
    const headers = buildHeaders(false, apiKey);
    const res = await fetch(`${baseUrl}/categories/${periodeTabId}`, { headers });

    if (!res.ok) {
        const details = await extractUpstreamError(res);
        throw new KahierServiceError(`Impossible de récupérer les catégories. ${details}`, res.status);
    }

    const categories = (await res.json()) as KahierCategory[];
    const category = categories.find((entry) => entry.id === categoryId);

    if (!category) {
        throw new KahierServiceError("Catégorie introuvable", 404);
    }

    return [...(category.Task ?? [])].sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.name.localeCompare(b.name, "fr");
    }) as KahierTask[];
}

export async function setTaskCompletion(
    taskId: number,
    payload: KahierSetTaskCompletionPayload,
    apiKey?: string | null,
) {
    const currentTask = (await getCategoryTasks(payload.categoryId, payload.periodeTabId, apiKey)).find(
        (task) => task.id === taskId,
    );

    if (!currentTask) {
        throw new KahierServiceError("Tâche introuvable", 404);
    }

    if (currentTask.completed === payload.completed) {
        return currentTask;
    }

    const baseUrl = requireEnv("KAHIER_API_BASE");
    const res = await fetch(`${baseUrl}/tasks/${taskId}/toggle`, {
        method: "PATCH",
        headers: buildHeaders(true, apiKey),
    });

    if (!res.ok) {
        const details = await extractUpstreamError(res);
        throw new KahierServiceError(`Impossible de mettre à jour la tâche. ${details}`, res.status);
    }

    return (await res.json()) as KahierTask;
}
