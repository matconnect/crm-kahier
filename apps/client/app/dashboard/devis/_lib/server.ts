import { getServerApiBase } from "@/lib/api-base";
import type { ClientOption, Quote, QuoteSummary } from "./quotes";

export async function fetchQuotes(userId: string, query = "") {
    const apiBase = getServerApiBase();
    if (!apiBase) return null;
    try {
        const response = await fetch(`${apiBase}/quotes?page=1&pageSize=100${query}`, {
            cache: "no-store",
            headers: { "x-user-id": userId },
        });
        if (!response.ok) return null;
        return (await response.json()) as { items: Quote[]; total: number; page: number; pageSize: number };
    } catch {
        return null;
    }
}

export async function fetchQuoteSummary(userId: string) {
    const apiBase = getServerApiBase();
    if (!apiBase) return null;
    try {
        const response = await fetch(`${apiBase}/quotes/summary`, {
            cache: "no-store",
            headers: { "x-user-id": userId },
        });
        return response.ok ? ((await response.json()) as QuoteSummary) : null;
    } catch {
        return null;
    }
}

export async function fetchQuote(id: string, userId: string) {
    const apiBase = getServerApiBase();
    if (!apiBase) return null;
    try {
        const response = await fetch(`${apiBase}/quotes/${encodeURIComponent(id)}`, {
            cache: "no-store",
            headers: { "x-user-id": userId },
        });
        return response.ok ? ((await response.json()) as Quote) : null;
    } catch {
        return null;
    }
}

export async function fetchQuoteClients(userId: string): Promise<ClientOption[]> {
    const apiBase = getServerApiBase();
    if (!apiBase) return [];
    try {
        const response = await fetch(`${apiBase}/clients?page=1&pageSize=200`, {
            cache: "no-store",
            headers: { "x-user-id": userId },
        });
        if (!response.ok) return [];
        const data = (await response.json()) as { items?: ClientOption[] };
        return data.items ?? [];
    } catch {
        return [];
    }
}
