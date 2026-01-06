import { ClientSegment, ClientStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { ClientCard } from "./client-card";

type Interaction = {
    id: string;
    type: string;
    summary: string | null;
    occurredAt: string;
    user?: { firstName: string | null; lastName: string | null; email: string | null } | null;
};

type ApiListResponse = {
    items: {
        id: string;
        name: string;
        segment: ClientSegment;
        status: ClientStatus;
        location: string | null;
        notes: string | null;
        contactsCount: number;
        owner: { firstName: string | null; lastName: string | null; email: string | null } | null;
        primaryEmail: string | null;
        primaryPhone: string | null;
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
    companyId: string;
};

export async function ClientsList({ searchParams, currentUserId, companyId }: ListProps) {
    const page = Number(searchParams.page ?? "1") || 1;
    const pageSize = Number(searchParams.pageSize ?? "20") || 20;

    const statusFilter = parseStatus(searchParams.status);
    const segmentFilter = parseSegment(searchParams.segment);
    const location = searchParams.location?.trim();
    const q = searchParams.q?.trim();

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
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

    const res = await fetch(`${apiBase}/clients?${params.toString()}`, {
        cache: "no-store",
        headers: { "x-company-id": companyId },
    });
    if (!res.ok) {
        throw new Error("Impossible de récupérer les clients");
    }
    const data = (await res.json()) as ApiListResponse;

    const clients = data.items.map((client) => ({
        ...client,
        interactions: client.interactions.map((i) => ({
            ...i,
            occurredAt: i.occurredAt,
        })),
    }));
    const total = data.total;

    return (
        <section id="clients-list" className="space-y-3 scroll-mt-36">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Clients</h2>
                    <p className="text-sm text-muted-foreground">Liste des clients et derniers échanges.</p>
                </div>
                <Badge variant="secondary">
                    {total} client{total > 1 ? "s" : ""}
                </Badge>
            </div>

            {clients.length === 0 ? (
                <div className="rounded-lg border border-dashed border-muted/60 bg-muted/50 p-6 text-sm text-muted-foreground">
                    Aucun client ne correspond à ces filtres pour le moment.
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
                                owner: client.owner,
                                contactsCount: client.contactsCount,
                                primaryPhone: client.primaryPhone,
                                primaryEmail: client.primaryEmail,
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
                            companyId={companyId}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function parseStatus(value?: string | null) {
    if (!value) return undefined;
    return Object.values(ClientStatus).includes(value as ClientStatus) ? (value as ClientStatus) : undefined;
}

function parseSegment(value?: string | null) {
    if (!value) return undefined;
    return Object.values(ClientSegment).includes(value as ClientSegment) ? (value as ClientSegment) : undefined;
}
