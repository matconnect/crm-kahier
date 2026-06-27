"use client";

import Link from "next/link";
import { Eye, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRevenueSourceLabel, type ClientSegment, type ClientStatus, type RevenueSource } from "@/lib/client-enums";

import { DeleteClientDialog } from "./delete-client-dialog";

type Interaction = {
    id: string;
    type: string;
    summary: string | null;
    occurredAt: string;
};

type ClientCardProps = {
    client: {
        id: string;
        name: string;
        segment: ClientSegment;
        status: ClientStatus;
        location: string | null;
        revenueSource: RevenueSource | null;
        owner: { firstName: string | null; lastName: string | null; email: string | null } | null;
        contactsCount: number;
        primaryEmail: string | null;
        primaryPhone: string | null;
        emails: string[];
        phones: string[];
        notes: string | null;
        interactions: Interaction[];
    };
    currentUserId: string;
};

export function ClientCard({ client, currentUserId }: ClientCardProps) {
    const ownerFullName = `${client.owner?.firstName ?? ""} ${client.owner?.lastName ?? ""}`.trim();
    const ownerDisplay = ownerFullName || client.owner?.email || "Non assigné";
    const segmentLabel = client.segment === "OTHER" ? "AUTRE" : client.segment;
    const statusLabel =
        client.status === "ACTIVE"
            ? "Client actif"
            : client.status === "INACTIVE"
                ? "Client inactif"
                : client.status === "PROSPECT"
                    ? "Prospect"
                    : client.status;
    const lastActivity = client.interactions[0]?.occurredAt
        ? format(new Date(client.interactions[0].occurredAt), "P", { locale: fr })
        : "Aucune";
    const revenueSourceLabel = getRevenueSourceLabel(client.revenueSource);
    const primaryEmail = client.primaryEmail ?? client.emails[0] ?? null;
    const primaryPhone = client.primaryPhone ?? client.phones[0] ?? null;

    return (
        <Card className="rounded-2xl border border-slate-200 bg-white/95 shadow-[0_16px_42px_rgba(28,35,54,0.06)] transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)]">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                        <CardTitle className="truncate text-base text-slate-950">
                            <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                                {client.name}
                            </Link>
                        </CardTitle>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{client.location ?? "Non renseigné"}</span>
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                            {statusLabel}
                        </Badge>
                        <Badge variant="outline" className="border-slate-300 bg-white/70">
                            {segmentLabel}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm text-slate-600">
                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase text-slate-400">Gestionnaire</p>
                        <p className="mt-1 truncate text-sm font-medium text-slate-950">{ownerDisplay}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase text-slate-400">Contacts</p>
                        <p className="mt-1 text-sm font-medium text-slate-950">
                            {client.contactsCount} contact{client.contactsCount > 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase text-slate-400">Dernière interaction</p>
                        <p className="mt-1 text-sm font-medium text-slate-950">{lastActivity}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <p className="text-[11px] uppercase text-slate-400">Source</p>
                        <p className="mt-1 truncate text-sm font-medium text-slate-950">{revenueSourceLabel}</p>
                    </div>
                </div>

                {(primaryEmail || primaryPhone) && (
                    <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                        {primaryEmail && (
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 shrink-0" />
                                <span className="truncate">{primaryEmail}</span>
                            </div>
                        )}
                        {primaryPhone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 shrink-0" />
                                <span className="truncate">{primaryPhone}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Voir le détail">
                        <Link href={`/dashboard/clients/${client.id}`}>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Modifier">
                        <Link href={`/dashboard/clients/${client.id}?edit=1`}>
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                    <DeleteClientDialog
                        clientId={client.id}
                        clientName={client.name}
                        currentUserId={currentUserId}
                        triggerClassName="h-10 w-10 rounded-full text-red-600 hover:text-red-700"
                        triggerIconOnly
                        triggerLabel="Supprimer"
                        triggerTitle="Supprimer"
                    />
                </div>
            </CardContent>
        </Card>
    );
}
