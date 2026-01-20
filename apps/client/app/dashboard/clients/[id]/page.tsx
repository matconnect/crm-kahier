import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import type { ClientSegment, ClientStatus } from "@/lib/client-enums";
import { requireAuth } from "@/lib/authz";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogInteraction } from "../_components/log-interaction";
import { InteractionsList } from "../_components/interactions-list";
import { EditClientDialog } from "../_components/edit-client-dialog";
import { AddContactDialog } from "../_components/add-contact-dialog";
import { EditContactDialog } from "../_components/edit-contact-dialog";
import { DeleteContactDialog } from "../_components/delete-contact-dialog";

type DetailPageProps = {
    params: { id: string };
};

type ClientDetail = {
    id: string;
    name: string;
    segment: ClientSegment;
    status: ClientStatus;
    location: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
    notes: string | null;
    owner: { firstName: string | null; lastName: string | null; email: string | null } | null;
    contacts: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        role: string | null;
    }[];
    interactions: {
        id: string;
        type: string;
        summary: string | null;
        occurredAt: string;
        user?: { firstName: string | null; lastName: string | null; email: string | null } | null;
        collaborators?: { firstName: string | null; lastName: string | null; email: string | null }[];
        meetingStart?: string | null;
        meetingEnd?: string | null;
    }[];
};

async function fetchClient(id: string, currentUserId: string): Promise<ClientDetail | null> {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
        throw new Error("NEXT_PUBLIC_API_URL manquant pour récupérer le client");
    }
    const res = await fetch(`${apiBase}/clients/${id}`, {
        cache: "no-store",
        headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Impossible de récupérer le client");
    const data = (await res.json()) as ClientDetail;

    return {
        ...data,
        interactions: data.interactions.map((i) => ({
            ...i,
            occurredAt: new Date(i.occurredAt).toISOString(),
            meetingStart: i.meetingStart ? new Date(i.meetingStart).toISOString() : null,
            meetingEnd: i.meetingEnd ? new Date(i.meetingEnd).toISOString() : null,
            collaborators: i.collaborators ?? [],
        })),
    };
}

export default async function ClientDetailPage({ params }: DetailPageProps) {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";

    const { id } = await params;
    if (!id) {
        notFound();
    }

    const client = await fetchClient(id, currentUserId);

    if (!client) notFound();

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

    return (
        <div className="min-h-screen bg-background">
            <DashboardTopBar
                subtitle="Client"
                anchors={[
                    { label: "Note", href: "#client-summary" },
                    { label: "Contacts", href: "#client-contacts" },
                    { label: "Interactions", href: "#client-interactions" },
                ]}
            />

            <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1" id="client-summary">
                            <div className="text-xs text-muted-foreground uppercase tracking-wide">{client.segment}</div>
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{client.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            Statut : {statusLabel} · Gestionnaire : {ownerDisplay}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            {client.location && (
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    {client.location}
                                </span>
                            )}
                            {client.primaryEmail && (
                                <span className="inline-flex items-center gap-1">
                                    <Mail className="h-4 w-4" />
                                    {client.primaryEmail}
                                </span>
                            )}
                            {client.primaryPhone && (
                                <span className="inline-flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    {client.primaryPhone}
                                </span>
                            )}
                        </div>
                    </div>

                    <Link
                        href="/dashboard/clients"
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour liste
                    </Link>
                    <div className="flex flex-wrap gap-2">
                        <EditClientDialog
                            clientId={client.id}
                            name={client.name}
                            status={client.status}
                            segment={client.segment}
                            location={client.location}
                            primaryEmail={client.primaryEmail}
                            primaryPhone={client.primaryPhone}
                            notes={client.notes}
                            currentUserId={currentUserId}
                        />
                        <AddContactDialog clientId={client.id} currentUserId={currentUserId} />
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border-muted/60">
                        <CardHeader>
                            <CardTitle className="text-base">Notes & dernières interactions</CardTitle>
                            <CardDescription>Vue d’ensemble des notes et échanges récents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Notes</div>
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {client.notes ?? "Aucune note."}
                                </p>
                            </div>
                            <Separator />
                            <div id="client-interactions" className="space-y-3">
                                <div className="text-sm font-medium">Interactions</div>
                                <InteractionsList
                                    interactions={client.interactions}
                                    clientId={client.id}
                                    currentUserId={currentUserId}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted/60" id="client-contacts">
                        <CardHeader>
                            <CardTitle className="text-base">Contacts</CardTitle>
                            <CardDescription>Liste des personnes liées au compte.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {client.contacts.length === 0 && (
                                <p className="text-sm text-muted-foreground">Aucun contact associé.</p>
                            )}
                            {client.contacts.map((contact) => (
                                <div key={contact.id} className="rounded-md border border-dashed border-muted px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium">
                                            {`${contact.firstName} ${contact.lastName}`.trim() || "Contact"}
                                        </div>
                                        {contact.role && (
                                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                                                {contact.role}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                                        {contact.email && (
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-4 w-4" />
                                                {contact.email}
                                            </span>
                                        )}
                                        {contact.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="h-4 w-4" />
                                                {contact.phone}
                                            </span>
                                        )}
                                    </div>
                                    <div className="pt-2 flex flex-wrap gap-2 justify-end">
                                        <EditContactDialog clientId={client.id} contact={contact} currentUserId={currentUserId} />
                                        <DeleteContactDialog clientId={client.id} contactId={contact.id} currentUserId={currentUserId} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <LogInteraction clientId={client.id} currentUserId={currentUserId} />
            </div>
        </div>
    );
}
