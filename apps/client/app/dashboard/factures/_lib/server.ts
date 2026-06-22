import { getServerApiBase } from "@/lib/api-base";
import type { ClientOption, Invoice, InvoiceSummary } from "./invoices";

export async function fetchInvoices(userId: string, query = "") {
    const apiBase = getServerApiBase();
    if (!apiBase) return null;
    try {
        const response = await fetch(`${apiBase}/invoices?page=1&pageSize=100${query}`, {
            cache: "no-store",
            headers: { "x-user-id": userId },
        });
        if (!response.ok) return null;
        return (await response.json()) as { items: Invoice[]; total: number; page: number; pageSize: number };
    } catch {
        return null;
    }
}

export async function fetchInvoiceSummary(userId: string) {
    const apiBase = getServerApiBase();
    if (!apiBase) return null;
    try {
        const response = await fetch(`${apiBase}/invoices/summary`, {
            cache: "no-store",
            headers: { "x-user-id": userId },
        });
        return response.ok ? ((await response.json()) as InvoiceSummary) : null;
    } catch {
        return null;
    }
}

export async function fetchInvoice(id: string, userId: string) {
    const apiBase = getServerApiBase();
    if (!apiBase) return null;
    try {
        const response = await fetch(`${apiBase}/invoices/${encodeURIComponent(id)}`, {
            cache: "no-store",
            headers: { "x-user-id": userId },
        });
        return response.ok ? ((await response.json()) as Invoice) : null;
    } catch {
        return null;
    }
}

export async function fetchInvoiceClients(userId: string): Promise<ClientOption[]> {
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
