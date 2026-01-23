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
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { ContactFlash } from "./contact-flash";
import { LogInteraction } from "./log-interaction";
import { EditClientDialog } from "./edit-client-dialog";
import type { ClientSegment, ClientStatus } from "@/lib/client-enums";

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

    const primaryPhone = client.primaryPhone ?? null;
    const primaryEmail = client.primaryEmail ?? null;
    const [page, setPage] = useState(1);
    const perPage = 5;
    const totalPages = useMemo(() => Math.max(1, Math.ceil(client.interactions.length / perPage)), [client.interactions.length]);
    const pagedInteractions = useMemo(
        () => client.interactions.slice((page - 1) * perPage, page * perPage),
        [client.interactions, page],
    );

    return (
        <Card className="border-muted/60">
            <CardHeader className="space-y-2">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2">
                            <Badge variant="outline">{segmentLabel}</Badge>
                            <Badge variant="secondary">{statusLabel}</Badge>
                        </div>
                        <CardTitle className="text-lg">
                            <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                                {client.name}
                            </Link>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs uppercase tracking-wide">
                            <MapPin className="h-3 w-3" />
                            {client.location ?? "Non renseigné"}
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="gap-1">
                        <Building2 className="h-4 w-4" />
                        {client.contactsCount} contact{client.contactsCount > 1 ? "s" : ""}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Gestionnaire : <span className="text-foreground">{ownerDisplay}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Dernière interaction : <span className="text-foreground">{lastActivity}</span>
                </div>
                <Separator />
                <ContactFlash
                    primaryPhone={primaryPhone}
                    primaryEmail={primaryEmail}
                    emails={client.emails}
                    phones={client.phones}
                />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 w-full">
                            <History className="h-4 w-4" />
                            Voir les interactions
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-2rem)] max-w-xl max-h-[90vh] overflow-hidden rounded-2xl">
                        <div className="flex max-h-[90vh] flex-col gap-3">
                            <DialogHeader>
                                <DialogTitle>Interactions récentes</DialogTitle>
                                <DialogDescription>Les interactions les plus récentes enregistrées pour ce client.</DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 max-h-[20vh] space-y-2 overflow-y-auto pr-1">
                                {client.interactions.length === 0 && (
                                    <p className="text-sm text-muted-foreground">Aucune interaction enregistrée.</p>
                                )}
                                {pagedInteractions.map((interaction) => (
                                    <div key={interaction.id} className="rounded-lg border border-dashed border-muted px-3 py-2">
                                        <div className="flex flex-col gap-1 text-sm font-medium sm:flex-row sm:items-center sm:justify-between">
                                            <span className="truncate">{interaction.type}</span>
                                            <span className="text-xs text-muted-foreground sm:shrink-0">
                                                {format(new Date(interaction.occurredAt), "Pp", { locale: fr })}
                                            </span>
                                        </div>
                                        {interaction.summary && (
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-3 break-words">
                                                {interaction.summary}
                                            </p>
                                        )}
                                        {interaction.type === "Réunion" && interaction.meetingStart && interaction.meetingEnd && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {format(new Date(interaction.meetingStart), "Pp", { locale: fr })} →{" "}
                                                {format(new Date(interaction.meetingEnd), "Pp", { locale: fr })}
                                            </p>
                                        )}
                                        {interaction.user && (
                                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2 break-words">
                                                Par{" "}
                                                {`${interaction.user.firstName ?? ""} ${interaction.user.lastName ?? ""}`.trim() ||
                                                    interaction.user.email ||
                                                    "Utilisateur"}
                                            </p>
                                        )}
                                        {interaction.collaborators && interaction.collaborators.length > 0 && (
                                            <p className="text-xs text-muted-foreground line-clamp-2 break-words">
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
                                {client.interactions.length > 0 && (
                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                                        <span>
                                            Page {page} / {totalPages}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={page <= 1}
                                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            >
                                                Précédent
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={page >= totalPages}
                                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            >
                                                Suivant
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="max-h-[40vh] overflow-y-auto pr-1 pt-1">
                                <LogInteraction clientId={client.id} currentUserId={currentUserId} />
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
                <div className="grid grid-cols-2 gap-2">
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
                        triggerClassName="w-full justify-center"
                        currentUserId={currentUserId}
                    />
                    <Button asChild variant="outline" size="sm" className="gap-2 w-full">
                        <Link href={`/dashboard/clients/${client.id}`} className="text-black">
                            Voir le détail
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
