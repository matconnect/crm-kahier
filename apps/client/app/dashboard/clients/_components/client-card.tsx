"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, Mail, MapPin, User, History } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { ContactFlash } from "./contact-flash";
import { LogInteraction } from "./log-interaction";
import { EditClientDialog } from "./edit-client-dialog";
import { DeleteClientDialog } from "./delete-client-dialog";
import { getRevenueSourceLabel, type ClientSegment, type ClientStatus, type RevenueSource } from "@/lib/client-enums";

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
        primaryPhone: string | null;
        primaryEmail: string | null;
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

    const primaryPhone = client.primaryPhone ?? null;
    const primaryEmail = client.primaryEmail ?? null;
    const [page, setPage] = useState(1);
    const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
    const perPage = 5;
    const totalPages = useMemo(() => Math.max(1, Math.ceil(client.interactions.length / perPage)), [client.interactions.length]);
    const pagedInteractions = useMemo(
        () => client.interactions.slice((page - 1) * perPage, page * perPage),
        [client.interactions, page],
    );

    return (
        <Card className="rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_42px_rgba(28,35,54,0.06)] backdrop-blur-sm transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)] h-full">
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2">
                            <Badge variant="outline" className="border-slate-300 bg-white/70">{segmentLabel}</Badge>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700">{statusLabel}</Badge>
                        </div>
                        <CardTitle className="text-lg text-slate-950">
                            <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                                {client.name}
                            </Link>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs uppercase  text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {client.location ?? "Non renseigné"}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1 border-slate-300 bg-white/70">
                        <Building2 className="h-4 w-4" />
                        {client.contactsCount} contact{client.contactsCount > 1 ? "s" : ""}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Gestionnaire : <span className="text-slate-950">{ownerDisplay}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Dernière interaction : <span className="text-slate-950">{lastActivity}</span>
                </div>
                <Separator className="bg-slate-200/70" />
                <ContactFlash
                    primaryPhone={primaryPhone}
                    primaryEmail={primaryEmail}
                    emails={client.emails}
                    phones={client.phones}
                />
                <Dialog open={interactionDialogOpen} onOpenChange={setInteractionDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 w-full rounded-full border-slate-300 bg-white/80">
                            <History className="h-4 w-4" />
                            Voir les interactions
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-2rem)] max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl p-0">
                        <div className="grid max-h-[92vh] min-h-0 gap-0 lg:grid-cols-[minmax(0,1fr)_520px]">
                            <section className="flex min-h-0 flex-col border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r lg:p-6">
                                <DialogHeader className="shrink-0">
                                    <DialogTitle>Interactions</DialogTitle>
                                </DialogHeader>
                                <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                                    {client.interactions.length === 0 && (
                                        <p className="rounded-[1.25rem] border border-dashed border-slate-300 px-3 py-4 text-sm text-muted-foreground">
                                            Aucune interaction.
                                        </p>
                                    )}
                                    {pagedInteractions.map((interaction) => (
                                        <div key={interaction.id} className="rounded-[1.25rem] border border-dashed border-slate-300 px-3 py-2">
                                            <div className="flex flex-col gap-1 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
                                                <span className="truncate">{interaction.type}</span>
                                                <span className="text-xs text-slate-500 sm:shrink-0">
                                                    {format(new Date(interaction.occurredAt), "Pp", { locale: fr })}
                                                </span>
                                            </div>
                                            {interaction.summary && (
                                                <p className="mt-1 text-sm text-slate-500 line-clamp-3 break-words">
                                                    {interaction.summary}
                                                </p>
                                            )}
                                            {interaction.type === "Réunion" && interaction.meetingStart && interaction.meetingEnd && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {format(new Date(interaction.meetingStart), "Pp", { locale: fr })} →{" "}
                                                    {format(new Date(interaction.meetingEnd), "Pp", { locale: fr })}
                                                </p>
                                            )}
                                            {interaction.user && (
                                                <p className="mt-1 text-xs text-slate-500 line-clamp-2 break-words">
                                                    Par{" "}
                                                    {`${interaction.user.firstName ?? ""} ${interaction.user.lastName ?? ""}`.trim() ||
                                                        interaction.user.email ||
                                                        "Utilisateur"}
                                                </p>
                                            )}
                                            {interaction.collaborators && interaction.collaborators.length > 0 && (
                                                <p className="text-xs text-slate-500 line-clamp-2 break-words">
                                                    Avec{" "}
                                                    {interaction.collaborators
                                                        .map(
                                                            (collaborator) =>
                                                                `${collaborator.firstName ?? ""} ${collaborator.lastName ?? ""}`.trim() ||
                                                                collaborator.email ||
                                                                "Collaborateur",
                                                        )
                                                        .join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {client.interactions.length > 0 && (
                                    <div className="mt-4 flex shrink-0 items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
                                        <span>
                                            Page {page} / {totalPages}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full border-slate-300 bg-white/80"
                                                disabled={page <= 1}
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            >
                                                Précédent
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full border-slate-300 bg-white/80"
                                                disabled={page >= totalPages}
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            >
                                                Suivant
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </section>
                            <section className="min-h-0 overflow-y-auto bg-[#f8f9fd] p-5 lg:p-6">
                                {interactionDialogOpen ? (
                                    <LogInteraction clientId={client.id} currentUserId={currentUserId} enabled={interactionDialogOpen} />
                                ) : null}
                            </section>
                        </div>
                    </DialogContent>
                </Dialog>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <EditClientDialog
                        clientId={client.id}
                        name={client.name}
                        status={client.status}
                        segment={client.segment}
                        location={client.location}
                        primaryEmail={client.primaryEmail}
                        primaryPhone={client.primaryPhone}
                        emails={client.emails}
                        phones={client.phones}
                        notes={client.notes}
                        revenueSource={client.revenueSource}
                        triggerClassName="w-full justify-center"
                        currentUserId={currentUserId}
                    />
                    <DeleteClientDialog
                        clientId={client.id}
                        clientName={client.name}
                        currentUserId={currentUserId}
                        triggerClassName="w-full justify-center gap-2"
                    />
                    <Button asChild variant="outline" size="sm" className="gap-2 w-full bg-white/80">
                        <Link href={`/dashboard/clients/${client.id}`} className="text-slate-950">
                            Voir le détail
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
