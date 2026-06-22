import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, BriefcaseBusiness, Mail, MapPin, Phone } from "lucide-react";
import { getRevenueSourceLabel, type ClientSegment, type ClientStatus, type RevenueSource } from "@/lib/client-enums";
import { getServerApiBase } from "@/lib/api-base";
import { requireAuth } from "@/lib/authz";
import type { Role } from "@/lib/roles";
import { MotionReveal } from "@/components/motion/reveal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogInteraction } from "../_components/log-interaction";
import { InteractionsList } from "../_components/interactions-list";
import { EditClientDialog } from "../_components/edit-client-dialog";
import { AddContactDialog } from "../_components/add-contact-dialog";
import { EditContactDialog } from "../_components/edit-contact-dialog";
import { DeleteContactDialog } from "../_components/delete-contact-dialog";
import { DeleteClientDialog } from "../_components/delete-client-dialog";
import { ClientDocumentsCard } from "../_components/client-documents-card";
import { DashboardShell, fetchDashboardData } from "../../_components";

type DetailPageProps = {
    params: Promise<{ id: string }>;
};

const actionButtonClass =
    "h-10 rounded-full border-[#d7dced] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]";

type ClientDetail = {
    id: string;
    name: string;
    segment: ClientSegment;
    status: ClientStatus;
    revenueSource: RevenueSource | null;
    location: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
    ownerId: string | null;
    ownerIds?: string[] | null;
    emails?: string[] | null;
    phones?: string[] | null;
    notes: string | null;
    owner: { firstName: string | null; lastName: string | null; email: string | null } | null;
    owners: { userId: string; user?: { firstName: string | null; lastName: string | null; email: string | null } | null }[];
    contacts: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        emails?: string[] | null;
        phones?: string[] | null;
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
    projects: {
        id: string;
        name: string;
        status: "DRAFT" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
        priority: "LOW" | "MEDIUM" | "HIGH";
        progress: number;
        revenueAmount: number | null;
        costAmount: number | null;
        invoicedAmount: number | null;
        receivedAmount: number | null;
        endDate: string | null;
    }[];
};

const PROJECT_STATUS_META = {
    DRAFT: { label: "En cadrage", tone: "bg-slate-50 text-slate-700 border-slate-200" },
    IN_PROGRESS: { label: "En production", tone: "bg-slate-50 text-slate-700 border-slate-200" },
    ON_HOLD: { label: "En pause", tone: "bg-slate-50 text-slate-700 border-slate-200" },
    COMPLETED: { label: "Clôturé", tone: "bg-slate-100 text-slate-700 border-slate-200" },
} as const;

const PROJECT_PRIORITY_LABEL = {
    LOW: "Basse",
    MEDIUM: "Moyenne",
    HIGH: "Haute",
} as const;

function formatAmount(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return `${value.toLocaleString("fr-FR")} €`;
}

async function fetchClient(id: string, currentUserId: string): Promise<ClientDetail | null> {
    const apiBase = getServerApiBase();
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
    const currentUserRole = (session.user?.role ?? "USER") as Role;
    const firstName = session.user?.firstName?.trim() || "équipe";
    const dashboardData = await fetchDashboardData(currentUserId);

    const { id } = await params;
    if (!id) {
        notFound();
    }

    const client = await fetchClient(id, currentUserId);

    if (!client) notFound();

    const ownerFullName = `${client.owner?.firstName ?? ""} ${client.owner?.lastName ?? ""}`.trim();
    const ownerDisplay = ownerFullName || client.owner?.email || "Non assigné";
    const managerNames = (client.owners ?? [])
        .filter((o) => o.userId !== client.ownerId)
        .map((o) => {
            const fullName = `${o.user?.firstName ?? ""} ${o.user?.lastName ?? ""}`.trim();
            return fullName || o.user?.email || "";
        })
        .filter(Boolean);
    const clientEmails = (client.emails ?? []).filter(Boolean);
    const clientPhones = (client.phones ?? []).filter(Boolean);
    const statusLabel =
        client.status === "ACTIVE"
            ? "Client actif"
            : client.status === "INACTIVE"
                ? "Client inactif"
                : client.status === "PROSPECT"
                ? "Prospect"
                : client.status;
    const revenueSourceLabel = getRevenueSourceLabel(client.revenueSource);
    const now = Date.now();
    const alertWindowDays = 7;
    const alertWindowMs = alertWindowDays * 24 * 60 * 60 * 1000;
    const upcomingInteractions = client.interactions
        .map((interaction) => ({
            ...interaction,
            upcomingAt: interaction.meetingStart ?? interaction.occurredAt,
        }))
        .filter((interaction) => {
            if (!interaction.upcomingAt) return false;
            const time = new Date(interaction.upcomingAt).getTime();
            return time >= now && time <= now + alertWindowMs;
        })
        .sort((a, b) => new Date(a.upcomingAt).getTime() - new Date(b.upcomingAt).getTime());
    const nextInteraction = upcomingInteractions[0];
    const assignedUserIds = new Set([
        ...(client.ownerId ? [client.ownerId] : []),
        ...(client.owners ?? []).map((o) => o.userId),
    ]);
    const canEdit = currentUserRole === "ADMIN" || assignedUserIds.has(currentUserId);

    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={dashboardData.summary}
            interactionsCount={dashboardData.interactions.length}
            activeMenu="clients"
            searchClients={dashboardData.clients}
            searchInteractions={dashboardData.interactions}
            searchProjects={dashboardData.projects}
        >
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                <MotionReveal>
                    <div className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="relative flex flex-wrap items-start justify-between gap-4">
                            <div className="space-y-1" id="client-summary">
                                <h1 className="mt-2 text-2xl font-bold  text-[#1f2335] md:text-3xl">{client.name}</h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{statusLabel}</Badge>
                                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{ownerDisplay}</Badge>
                                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{revenueSourceLabel}</Badge>
                                    {managerNames.length > 0 ? (
                                        <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">{managerNames.length} assigné(s)</Badge>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6f7488]">
                                    {client.location && (
                                        <span className="inline-flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            {client.location}
                                        </span>
                                    )}
                                    {(clientEmails[0] || client.primaryEmail) && (
                                        <span className="inline-flex items-center gap-1">
                                            <Mail className="h-4 w-4" />
                                            {clientEmails[0] ?? client.primaryEmail}
                                        </span>
                                    )}
                                    {(clientPhones[0] || client.primaryPhone) && (
                                        <span className="inline-flex items-center gap-1">
                                            <Phone className="h-4 w-4" />
                                            {clientPhones[0] ?? client.primaryPhone}
                                        </span>
                                    )}
                                </div>
                                {(clientEmails.length > 1 || clientPhones.length > 1) && (
                                    <div className="mt-3 grid gap-3 text-sm text-[#6f7488] sm:grid-cols-2">
                                        {clientEmails.length > 0 && (
                                            <div className="rounded-[1.25rem] border border-dashed border-[#d8ddeb] bg-white/70 px-3 py-2">
                                                <p className="text-xs text-[#8f93a9]">Emails</p>
                                                <div className="mt-1 space-y-1 text-sm font-medium text-[#2f3344]">
                                                    {clientEmails.map((email, index) => (
                                                        <div key={email} className="flex items-center gap-2">
                                                            <span className="break-all">{email}</span>
                                                            {index === 0 && <Badge variant="secondary">Principal</Badge>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {clientPhones.length > 0 && (
                                            <div className="rounded-[1.25rem] border border-dashed border-[#d8ddeb] bg-white/70 px-3 py-2">
                                                <p className="text-xs text-[#8f93a9]">Téléphones</p>
                                                <div className="mt-1 space-y-1 text-sm font-medium text-[#2f3344]">
                                                    {clientPhones.map((phone, index) => (
                                                        <div key={phone} className="flex items-center gap-2">
                                                            <span>{phone}</span>
                                                            {index === 0 && <Badge variant="secondary">Principal</Badge>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {nextInteraction && (
                                <Alert className="border-slate-200 bg-white text-slate-900">
                                    <AlertTriangle />
                                    <AlertTitle>À venir</AlertTitle>
                                    <AlertDescription>
                                        <p>
                                            {nextInteraction.type}{" "}
                                            {new Date(nextInteraction.upcomingAt).toLocaleString("fr-FR", {
                                                dateStyle: "medium",
                                                timeStyle: "short",
                                            })}
                                        </p>
                                        {upcomingInteractions.length > 1 && (
                                            <p>
                                                {upcomingInteractions.length - 1} autre(s) interaction(s) prévue(s) dans les {alertWindowDays} prochains jours.
                                            </p>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/clients"
                                    className={`inline-flex items-center justify-center gap-2 border ${actionButtonClass}`}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour liste
                                </Link>
                                {canEdit && (
                                    <>
                                        <EditClientDialog
                                            clientId={client.id}
                                            name={client.name}
                                            status={client.status}
                                            segment={client.segment}
                                            location={client.location}
                                            primaryEmail={client.primaryEmail}
                                            primaryPhone={client.primaryPhone}
                                            emails={client.emails ?? []}
                                            phones={client.phones ?? []}
                                            notes={client.notes}
                                            revenueSource={client.revenueSource}
                                            ownerIds={[
                                                ...(client.ownerId ? [client.ownerId] : []),
                                                ...(client.owners ?? []).map((o) => o.userId),
                                            ]}
                                            currentUserId={currentUserId}
                                            triggerClassName={actionButtonClass}
                                        />
                                        <AddContactDialog clientId={client.id} currentUserId={currentUserId} triggerClassName={actionButtonClass} />
                                        <DeleteClientDialog
                                            clientId={client.id}
                                            clientName={client.name}
                                            currentUserId={currentUserId}
                                            redirectTo="/dashboard/clients"
                                            triggerClassName={`gap-2 ${actionButtonClass}`}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </MotionReveal>

                <div className="grid gap-6 lg:grid-cols-3">
                    <MotionReveal delay={80} className="lg:col-span-2">
                        <div className="space-y-6">
                            <Card className="rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_42px_rgba(28,35,54,0.06)] backdrop-blur-sm transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)] lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-base text-slate-950">Notes & dernières interactions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-slate-950">Notes</div>
                                        <p className="text-sm whitespace-pre-line text-slate-600">
                                            {client.notes ?? "Aucune note."}
                                        </p>
                                    </div>
                                    <Separator className="bg-slate-200/70" />
                                    <div id="client-interactions" className="space-y-3">
                                        <div className="text-sm font-medium text-slate-950">Interactions</div>
                                        <InteractionsList
                                            interactions={client.interactions}
                                            clientId={client.id}
                                            currentUserId={currentUserId}
                                            canEdit={canEdit}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_42px_rgba(28,35,54,0.06)] backdrop-blur-sm transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)] lg:col-span-2" id="client-projects">
                                <CardHeader>
                                    <CardTitle className="text-base text-slate-950">Projets liés</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {client.projects.length === 0 ? (
                                        <p className="text-sm text-slate-500">Aucun projet lié à ce client.</p>
                                    ) : (
                                        client.projects.map((project) => (
                                            <Link
                                                key={project.id}
                                                href={`/dashboard/projects/${project.id}`}
                                                className="block rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="rounded-2xl bg-slate-950 p-2 text-white">
                                                                <BriefcaseBusiness className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-950">{project.name}</p>
                                                                <p className="text-xs text-slate-500">
                                                                    Priorité {PROJECT_PRIORITY_LABEL[project.priority].toLowerCase()}
                                                                    {project.endDate
                                                                        ? ` · Échéance ${new Date(project.endDate).toLocaleDateString("fr-FR", {
                                                                              day: "numeric",
                                                                              month: "short",
                                                                              timeZone: "Europe/Paris",
                                                                          })}`
                                                                        : ""}
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    Revenu {formatAmount(project.revenueAmount)} · Coût {formatAmount(project.costAmount)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className={PROJECT_STATUS_META[project.status].tone}>
                                                        {PROJECT_STATUS_META[project.status].label}
                                                    </Badge>
                                                </div>
                                                <div className="mt-4 space-y-2">
                                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                                        <span>Avancement</span>
                                                        <span>{project.progress}%</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-slate-100">
                                                        <div
                                                            className="h-2 rounded-full bg-slate-950"
                                                            style={{ width: `${project.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </MotionReveal>

                    <MotionReveal delay={130}>
                        <Card className="rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_42px_rgba(28,35,54,0.06)] backdrop-blur-sm transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)]" id="client-contacts">
                            <CardHeader>
                                <CardTitle className="text-base text-slate-950">Contacts</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {client.contacts.length === 0 && (
                                    <p className="text-sm text-slate-500">Aucun contact associé.</p>
                                )}
                                {client.contacts.map((contact) => (
                                    <div key={contact.id} className="rounded-[1.25rem] border border-dashed border-slate-300 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium">
                                            {`${contact.firstName} ${contact.lastName}`.trim() || "Contact"}
                                        </div>
                                        {contact.role && (
                                            <span className="text-xs text-muted-foreground uppercase ">
                                                {contact.role}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                                        {(contact.emails?.length ? contact.emails : contact.email ? [contact.email] : []).map((email, index) => (
                                            <span key={`${contact.id}-${email}`} className="flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                {email}
                                                {index === 0 && <Badge variant="secondary">Principal</Badge>}
                                            </span>
                                        ))}
                                        {(contact.phones?.length ? contact.phones : contact.phone ? [contact.phone] : []).map((phone, index) => (
                                            <span key={`${contact.id}-${phone}`} className="flex items-center gap-2">
                                                <Phone className="h-4 w-4" />
                                                {phone}
                                                {index === 0 && <Badge variant="secondary">Principal</Badge>}
                                            </span>
                                        ))}
                                    </div>
                                    {canEdit && (
                                        <div className="pt-2 flex flex-wrap gap-2 justify-end">
                                            <EditContactDialog clientId={client.id} contact={contact} currentUserId={currentUserId} />
                                            <DeleteContactDialog clientId={client.id} contactId={contact.id} currentUserId={currentUserId} />
                                        </div>
                                    )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </MotionReveal>
                </div>

                <MotionReveal delay={180}>
                    <ClientDocumentsCard
                        clientId={client.id}
                        currentUserId={currentUserId}
                        canEdit={canEdit}
                    />
                </MotionReveal>

                {canEdit && (
                    <MotionReveal delay={220}>
                        <LogInteraction clientId={client.id} currentUserId={currentUserId} />
                    </MotionReveal>
                )}
            </div>
        </DashboardShell>
    );
}
