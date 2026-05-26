import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    CalendarRange,
    CircleDollarSign,
    FilePenLine,
    FolderKanban,
    Target,
    UserRound,
} from "lucide-react";

import { getServerApiBase } from "@/lib/api-base";
import { requireAuth } from "@/lib/authz";
import { MotionReveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell, fetchDashboardData } from "../../_components";

type DetailPageProps = {
    params: Promise<{ id: string }>;
};

type ProjectDetail = {
    id: string;
    name: string;
    reference: string | null;
    description: string | null;
    context: string | null;
    goals: string | null;
    deliverables: string | null;
    successMetrics: string | null;
    risks: string | null;
    notes: string | null;
    status: "DRAFT" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
    priority: "LOW" | "MEDIUM" | "HIGH";
    progress: number;
    budgetAmount: number | null;
    revenueAmount: number | null;
    costAmount: number | null;
    invoicedAmount: number | null;
    receivedAmount: number | null;
    billingMode: string | null;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string;
    client: { id: string; name: string } | null;
    owner: { id: string; firstName: string; lastName: string; email: string } | null;
};

const STATUS_META = {
    DRAFT: { label: "En cadrage", tone: "bg-sky-50 text-sky-700 border-sky-200" },
    IN_PROGRESS: { label: "En production", tone: "bg-amber-50 text-amber-700 border-amber-200" },
    ON_HOLD: { label: "En pause", tone: "bg-rose-50 text-rose-700 border-rose-200" },
    COMPLETED: { label: "Clôturé", tone: "bg-slate-100 text-slate-700 border-slate-200" },
} as const;

const PRIORITY_META = {
    LOW: "Basse",
    MEDIUM: "Moyenne",
    HIGH: "Haute",
} as const;

const DISPLAY_TIME_ZONE = "Europe/Paris";

async function fetchProject(apiBase: string, currentUserId: string, id: string): Promise<ProjectDetail | null> {
    const response = await fetch(`${apiBase}/projects/${id}`, {
        cache: "no-store",
        headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Impossible de récupérer le projet");
    return (await response.json()) as ProjectDetail;
}

function formatDate(value: string | null, withTime = false) {
    if (!value) return "Non renseignée";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Non renseignée";
    return withTime
        ? date.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: DISPLAY_TIME_ZONE })
        : date.toLocaleDateString("fr-FR", { dateStyle: "medium", timeZone: DISPLAY_TIME_ZONE });
}

function formatOwner(project: ProjectDetail) {
    const fullName = `${project.owner?.firstName ?? ""} ${project.owner?.lastName ?? ""}`.trim();
    return fullName || project.owner?.email || "Non assigné";
}

function formatAmount(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return "Non renseigné";
    return `${value.toLocaleString("fr-FR")} €`;
}

function DetailBlock({ title, content }: { title: string; content: string | null }) {
    return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{content?.trim() || "Non renseigné"}</p>
        </div>
    );
}

export default async function ProjectDetailPage({ params }: DetailPageProps) {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";
    const currentUserRole = session.user?.role ?? "USER";
    const firstName = session.user?.firstName?.trim() || "équipe";
    const dashboardData = await fetchDashboardData(currentUserId);
    const apiBase = getServerApiBase();
    const { id } = await params;

    if (!id || !apiBase) {
        notFound();
    }

    const project = await fetchProject(apiBase, currentUserId, id);

    if (!project) {
        notFound();
    }

    const canEdit = currentUserRole === "ADMIN" || project.owner?.id === currentUserId;
    const marginAmount =
        typeof project.revenueAmount === "number" && typeof project.costAmount === "number"
            ? project.revenueAmount - project.costAmount
            : null;
    const outstandingAmount =
        typeof project.invoicedAmount === "number" && typeof project.receivedAmount === "number"
            ? project.invoicedAmount - project.receivedAmount
            : null;
    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={dashboardData.summary}
            interactionsCount={dashboardData.interactions.length}
            activeMenu="projects"
            searchClients={dashboardData.clients}
            searchInteractions={dashboardData.interactions}
            searchProjects={dashboardData.projects}
        >
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <MotionReveal>
                    <div
                        className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8"
                        id="project-summary"
                    >
                        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={STATUS_META[project.status].tone}>
                                        {STATUS_META[project.status].label}
                                    </Badge>
                                    <Badge variant="outline" className="border-[#d7dced] bg-white text-[#2f3344]">
                                        Priorité {PRIORITY_META[project.priority].toLowerCase()}
                                    </Badge>
                                    {project.reference ? (
                                        <Badge variant="outline" className="border-[#d7dced] bg-white text-[#2f3344]">
                                            {project.reference}
                                        </Badge>
                                    ) : null}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-[#1f2335] md:text-3xl">{project.name}</h1>
                                    <p className="mt-2 max-w-3xl text-sm text-[#6f7488]">
                                        {project.description || "Projet sans résumé renseigné pour le moment."}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-5 text-sm text-[#6f7488]">
                                    <span>Client : {project.client?.name ?? "Sans client"}</span>
                                    <span>Responsable : {formatOwner(project)}</span>
                                    <span>Mis à jour : {formatDate(project.updatedAt, true)}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/projects"
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 py-2 text-sm font-medium text-[#2f3344]"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour liste
                                </Link>
                                {canEdit ? (
                                    <Link
                                        href={`/dashboard/projects/${project.id}/edit`}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#111322] px-4 py-2 text-sm font-medium text-white"
                                    >
                                        <FilePenLine className="h-4 w-4" />
                                        Modifier la fiche
                                    </Link>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <FolderKanban className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Avancement</p>
                                <p className="mt-2 text-3xl font-semibold text-[#1e2234]">{project.progress}%</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <CalendarRange className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Planning</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatDate(project.startDate)}</p>
                                <p className="mt-1 text-sm text-[#6f7488]">Fin : {formatDate(project.endDate)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <CircleDollarSign className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Budget</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">
                                    {formatAmount(project.budgetAmount)}
                                </p>
                                <p className="mt-1 text-sm text-[#6f7488]">{project.billingMode || "Mode non renseigné"}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <UserRound className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Pilotage</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatOwner(project)}</p>
                                <p className="mt-1 text-sm text-[#6f7488]">Créé le {formatDate(project.createdAt, true)}</p>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Revenu prévisionnel</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatAmount(project.revenueAmount)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Coût projet</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatAmount(project.costAmount)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Marge estimée</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatAmount(marginAmount)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-[#8f93a9]">Reste à encaisser</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatAmount(outstandingAmount)}</p>
                            </div>
                        </div>
                    </div>
                </MotionReveal>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <MotionReveal delay={80}>
                        <section className="space-y-6" id="project-details">
                            <Card className="surface-panel rounded-[2rem] border-0">
                                <CardHeader>
                                    <CardTitle className="text-xl text-slate-950">Détail du projet</CardTitle>
                                    <CardDescription>Lecture complète de la fiche projet enregistrée dans le CRM.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 md:grid-cols-2">
                                    <DetailBlock title="Contexte" content={project.context} />
                                    <DetailBlock title="Objectifs" content={project.goals} />
                                    <DetailBlock title="Livrables" content={project.deliverables} />
                                    <DetailBlock title="Critères de réussite" content={project.successMetrics} />
                                    <DetailBlock title="Risques" content={project.risks} />
                                    <DetailBlock title="Notes internes" content={project.notes} />
                                </CardContent>
                            </Card>

                        </section>
                    </MotionReveal>

                    <MotionReveal delay={120}>
                        <aside className="space-y-6 xl:sticky xl:top-28" id="project-insights">
                            <Card className="surface-panel rounded-[2rem] border-0">
                                <CardHeader>
                                    <CardTitle className="text-lg text-slate-950">Lecture rapide</CardTitle>
                                    <CardDescription>Les points opérationnels utiles sans ouvrir le formulaire.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Priorité</p>
                                        <p className="mt-2 text-sm font-medium text-slate-950">{PRIORITY_META[project.priority]}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Client</p>
                                        <p className="mt-2 text-sm font-medium text-slate-950">{project.client?.name ?? "Sans client"}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Facturation</p>
                                        <p className="mt-2 text-sm font-medium text-slate-950">{project.billingMode || "Non renseignée"}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Facturé {formatAmount(project.invoicedAmount)} · Encaissé {formatAmount(project.receivedAmount)}
                                        </p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Objectif de pilotage</p>
                                        <p className="mt-2 text-sm font-medium text-slate-950">{project.progress}% réalisé</p>
                                        <div className="mt-3 h-2 rounded-full bg-slate-100">
                                            <div
                                                className="h-2 rounded-full bg-[linear-gradient(90deg,#f97316,#f59e0b)]"
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Suivi</p>
                                        <p className="mt-2 text-sm font-medium text-slate-950">Màj le {formatDate(project.updatedAt, true)}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="surface-panel rounded-[2rem] border-0">
                                <CardHeader>
                                    <CardTitle className="text-lg text-slate-950">Repères projet</CardTitle>
                                    <CardDescription>Les champs qui donnent le cadre de pilotage.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {canEdit ? (
                                        <Link
                                            href={`/dashboard/projects/${project.id}/edit`}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-0 bg-[#111322] px-4 py-3 text-sm font-medium text-white hover:bg-[#191d2e]"
                                        >
                                            <FilePenLine className="h-4 w-4" />
                                            Modifier le projet
                                        </Link>
                                    ) : (
                                        <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-sm text-slate-600">
                                            Modification indisponible avec ton niveau d’accès actuel.
                                        </div>
                                    )}
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-slate-700">
                                        <div className="flex items-center gap-2 text-slate-950">
                                            <Target className="h-4 w-4 text-amber-600" />
                                            <span className="text-sm font-medium">Cadrage</span>
                                        </div>
                                        <p className="mt-2 text-sm leading-6">{project.goals?.trim() || "Aucun objectif formalisé pour le moment."}</p>
                                    </div>
                                    <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-slate-700">
                                        <div className="flex items-center gap-2 text-slate-950">
                                            <Target className="h-4 w-4 text-emerald-600" />
                                            <span className="text-sm font-medium">Livrables attendus</span>
                                        </div>
                                        <p className="mt-2 text-sm leading-6">{project.deliverables?.trim() || "Aucun livrable renseigné."}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>
                    </MotionReveal>
                </div>
            </div>
        </DashboardShell>
    );
}
