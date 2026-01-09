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
    collaborator?: { firstName: string | null; lastName: string | null; email: string | null } | null;
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
        notes: string | null;
        interactions: Interaction[];
    };
    currentUserId: string;
};

export function ClientCard({ client, currentUserId }: ClientCardProps) {
    const ownerFullName = `${client.owner?.firstName ?? ""} ${client.owner?.lastName ?? ""}`.trim();
    const ownerDisplay = ownerFullName || client.owner?.email || "Non assigné";
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
                            <Badge variant="outline">{client.segment}</Badge>
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
                <ContactFlash primaryPhone={primaryPhone} primaryEmail={primaryEmail} />
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 w-full">
                            <History className="h-4 w-4" />
                            Voir les interactions
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                        <DialogHeader>
                            <DialogTitle>Interactions récentes</DialogTitle>
                            <DialogDescription>Les 10 dernières interactions enregistrées pour ce client.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                            {client.interactions.length === 0 && (
                                <p className="text-sm text-muted-foreground">Aucune interaction enregistrée.</p>
                            )}
                            {pagedInteractions.map((interaction) => (
                                <div key={interaction.id} className="rounded-md border border-dashed border-muted px-3 py-2">
                                    <div className="flex items-center justify-between text-sm font-medium">
                                        <span>{interaction.type}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(interaction.occurredAt), "Pp", { locale: fr })}
                                        </span>
                                    </div>
                                    {interaction.summary && (
                                        <p className="text-sm text-muted-foreground mt-1">{interaction.summary}</p>
                                    )}
                                    {interaction.type === "Réunion" && interaction.meetingStart && interaction.meetingEnd && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(interaction.meetingStart), "Pp", { locale: fr })} →{" "}
                                            {format(new Date(interaction.meetingEnd), "Pp", { locale: fr })}
                                        </p>
                                    )}
                                    {interaction.user && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Par{" "}
                                            {`${interaction.user.firstName ?? ""} ${interaction.user.lastName ?? ""}`.trim() ||
                                                interaction.user.email ||
                                                "Utilisateur"}
                                        </p>
                                    )}
                                    {interaction.collaborator && (
                                        <p className="text-xs text-muted-foreground">
                                            Avec{" "}
                                            {`${interaction.collaborator.firstName ?? ""} ${interaction.collaborator.lastName ?? ""}`.trim() ||
                                                interaction.collaborator.email ||
                                                "Collaborateur"}
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
                        <div className="pt-2">
                            <LogInteraction clientId={client.id} currentUserId={currentUserId} />
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
