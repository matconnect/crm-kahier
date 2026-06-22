import Link from "next/link";
import type { ClientSegment, ClientStatus, RevenueSource } from "@/lib/client-enums";
import { getServerApiBase } from "@/lib/api-base";
import { Eye, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRevenueSourceLabel } from "@/lib/client-enums";
import { ClientCard } from "./client-card";
import { DeleteClientDialog } from "./delete-client-dialog";

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
                <>
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-3 py-3 font-medium">Client</th>
                                    <th className="px-3 py-3 font-medium">Statut</th>
                                    <th className="px-3 py-3 font-medium">Segment</th>
                                    <th className="px-3 py-3 font-medium">Gestionnaire</th>
                                    <th className="px-3 py-3 font-medium">Contact</th>
                                    <th className="px-3 py-3 font-medium">Dernière interaction</th>
                                    <th className="px-3 py-3 font-medium">Source</th>
                                    <th className="px-3 py-3 text-right font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {clients.map((client) => {
                                    const ownerDisplay = getOwnerDisplay(client.owner);
                                    const contactEmail = client.primaryEmail ?? client.emails[0] ?? "Non renseigné";
                                    const lastInteraction = formatInteractionDate(client.interactions[0]?.occurredAt);

                                    return (
                                        <tr key={client.id} className="align-top transition hover:bg-slate-50">
                                            <td className="px-3 py-4">
                                                <div className="space-y-1">
                                                    <Link
                                                        href={`/dashboard/clients/${client.id}`}
                                                        className="font-semibold text-slate-950 hover:underline"
                                                    >
                                                        {client.name}
                                                    </Link>
                                                    <div className="text-xs text-slate-500">
                                                        {client.location ?? "Localisation non renseignée"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <Badge variant="secondary" className={STATUS_STYLES[client.status]}>
                                                    {STATUS_LABELS[client.status]}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-4">
                                                <Badge variant="outline" className="border-slate-300 bg-white/80">
                                                    {SEGMENT_LABELS[client.segment]}
                                                </Badge>
                                            </td>
                                            <td className="px-3 py-4 text-slate-700">{ownerDisplay}</td>
                                            <td className="px-3 py-4">
                                                <div className="space-y-1">
                                                    <div className="text-slate-700">{contactEmail}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {client.contactsCount} contact{client.contactsCount > 1 ? "s" : ""}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-slate-600">{lastInteraction}</td>
                                            <td className="px-3 py-4 text-slate-600">
                                                {getRevenueSourceLabel(client.revenueSource ?? null)}
                                            </td>
                                            <td className="px-3 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Modifier">
                                                        <Link href={`/dashboard/clients/${client.id}?edit=1`}>
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="sr-only">Modifier</span>
                                                        </Link>
                                                    </Button>
                                                    <DeleteClientDialog
                                                        clientId={client.id}
                                                        clientName={client.name}
                                                        currentUserId={currentUserId}
                                                        triggerVariant="ghost"
                                                        triggerSize="icon"
                                                        triggerIconOnly
                                                        triggerTitle="Supprimer"
                                                        triggerClassName="h-10 w-10 rounded-full text-red-600 hover:text-red-700"
                                                    />
                                                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Voir le détail">
                                                        <Link href={`/dashboard/clients/${client.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                            <span className="sr-only">Voir le détail</span>
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="grid gap-4 md:hidden">
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
                </>
            )}
        </section>
    );
}

const STATUS_LABELS: Record<ClientStatus, string> = {
    ACTIVE: "Client actif",
    INACTIVE: "Client inactif",
    PROSPECT: "Prospect",
};

const STATUS_STYLES: Record<ClientStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-800",
    INACTIVE: "bg-slate-100 text-slate-700",
    PROSPECT: "bg-amber-100 text-amber-800",
};

const SEGMENT_LABELS: Record<ClientSegment, string> = {
    TPE: "TPE",
    PME: "PME",
    ETI: "ETI",
    GE: "Grand compte",
    OTHER: "Autre",
};

const interactionDateFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
});

function getOwnerDisplay(owner: ApiListResponse["items"][number]["owner"]) {
    const fullName = `${owner?.firstName ?? ""} ${owner?.lastName ?? ""}`.trim();
    return fullName || owner?.email || "Non assigné";
}

function formatInteractionDate(value?: string | null) {
    if (!value) return "Aucune";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Aucune";
    return interactionDateFormatter.format(date);
}

function parseStatus(value?: string | null) {
    if (!value) return undefined;
    return ["ACTIVE", "INACTIVE", "PROSPECT"].includes(value) ? (value as ClientStatus) : undefined;
}

function parseSegment(value?: string | null) {
    if (!value) return undefined;
    return ["TPE", "PME", "ETI", "GE", "OTHER"].includes(value) ? (value as ClientSegment) : undefined;
}
