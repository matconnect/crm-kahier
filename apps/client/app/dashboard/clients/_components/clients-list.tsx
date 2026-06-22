import type { ClientSegment, ClientStatus, RevenueSource } from "@/lib/client-enums";
import { getServerApiBase } from "@/lib/api-base";

import { Badge } from "@/components/ui/badge";
import { ClientCard } from "./client-card";

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
        segment: ClientSegment;
        status: ClientStatus;
        location: string | null;
        notes: string | null;
        revenueSource: RevenueSource | null;
        contactsCount: number;
        owner: { firstName: string | null; lastName: string | null; email: string | null } | null;
        primaryEmail: string | null;
        primaryPhone: string | null;
        emails: string[];
        phones: string[];
        interactions: Interaction[];
    }[];
    total: number;
    page: number;
    pageSize: number;
};

type ListProps = {
    searchParams: {
        q?: string;
        status?: string;
        segment?: string;
        location?: string;
        page?: string;
        pageSize?: string;
    };
    currentUserId: string;
    currentUserRole: "USER" | "MANAGER" | "ADMIN";
};

export async function ClientsList({ searchParams, currentUserId, currentUserRole }: ListProps) {
    const page = Number(searchParams.page ?? "1") || 1;
    const pageSize = Number(searchParams.pageSize ?? "20") || 20;

    const statusFilter = parseStatus(searchParams.status);
    const segmentFilter = parseSegment(searchParams.segment);
    const location = searchParams.location?.trim();
    const q = searchParams.q?.trim();

    const apiBase = getServerApiBase();
    if (!apiBase) {
        throw new Error("NEXT_PUBLIC_API_URL manquant pour récupérer les clients");
    }

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (statusFilter) params.set("status", statusFilter);
    if (segmentFilter) params.set("segment", segmentFilter);
    if (location) params.set("location", location);
    if (q) params.set("q", q);

    let data: ApiListResponse = { items: [], total: 0, page, pageSize };
    let hasApiError = false;
    try {
        const res = await fetch(`${apiBase}/clients?${params.toString()}`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!res.ok) {
            hasApiError = true;
        } else {
            data = (await res.json()) as ApiListResponse;
        }
    } catch {
        hasApiError = true;
    }

    const clients = data.items.map((client) => ({
        ...client,
        interactions: client.interactions.map((i) => ({
            ...i,
            occurredAt: i.occurredAt,
            meetingStart: i.meetingStart ?? null,
            meetingEnd: i.meetingEnd ?? null,
            collaborators: i.collaborators ?? [],
        })),
    }));
    const total = data.total;

    return (
        <section id="clients-list" className="space-y-3 scroll-mt-36">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-950">Clients</h2>
                </div>
                <Badge variant="secondary" className="bg-slate-950 text-white">
                    {total} client{total > 1 ? "s" : ""}
                </Badge>
            </div>

            {clients.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500">
                    {hasApiError
                        ? "Le service clients est momentanément indisponible."
                        : currentUserRole === "USER"
                        ? "Aucun client accessible pour le moment."
                        : "Aucun client ne correspond à ces filtres pour le moment."}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {clients.map((client) => (
                        <ClientCard
                            key={client.id}
                            client={{
                                id: client.id,
                                name: client.name,
                                segment: client.segment,
                                status: client.status,
                                location: client.location,
                                revenueSource: client.revenueSource ?? null,
                                owner: client.owner,
                                contactsCount: client.contactsCount,
                                primaryPhone: client.primaryPhone,
                                primaryEmail: client.primaryEmail,
                                emails: client.emails,
                                phones: client.phones,
                                notes: client.notes,
                                interactions: client.interactions.map((i) => ({
                                    id: i.id,
                                    type: i.type,
                                    summary: i.summary,
                                    occurredAt: i.occurredAt,
                                    user: i.user,
                                })),
                            }}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function parseStatus(value?: string | null) {
    if (!value) return undefined;
    return ["ACTIVE", "INACTIVE", "PROSPECT"].includes(value) ? (value as ClientStatus) : undefined;
}

function parseSegment(value?: string | null) {
    if (!value) return undefined;
    return ["TPE", "PME", "ETI", "GE", "OTHER"].includes(value) ? (value as ClientSegment) : undefined;
}
