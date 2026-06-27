import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    CalendarRange,
    CircleDollarSign,
    FilePenLine,
    UserRound,
} from "lucide-react";

import { getServerApiBase } from "@/lib/api-base";
import { requireAuth } from "@/lib/authz";
import { MotionReveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell, fetchDashboardData } from "../../_components";
import { ProjectTaskProgress } from "../_components/project-task-progress";

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
    kahierTabId: number | null;
    kahierCategoryId: number | null;
    kahierCategoryName: string | null;
    kahierTaskCompletionState: Record<string, boolean> | null;
    createdAt: string;
    updatedAt: string;
    client: { id: string; name: string } | null;
    owner: { id: string; firstName: string; lastName: string; email: string } | null;
};

const STATUS_META = {
    DRAFT: { label: "En cadrage", tone: "bg-slate-50 text-slate-700 border-slate-200" },
    IN_PROGRESS: { label: "En production", tone: "bg-slate-50 text-slate-700 border-slate-200" },
    ON_HOLD: { label: "En pause", tone: "bg-slate-50 text-slate-700 border-slate-200" },
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
            <p className="text-xs uppercase  text-slate-400">{title}</p>
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
                                    <h1 className="text-2xl font-bold  text-[#1f2335] md:text-3xl">{project.name}</h1>
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
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour liste
                                </Link>
                                {canEdit ? (
                                    <Link
                                        href={`/dashboard/projects/${project.id}/edit`}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#111322] px-4 text-sm font-medium text-white hover:bg-[#191d2e]"
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
                                    <CalendarRange className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase  text-[#8f93a9]">Planning</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatDate(project.startDate)}</p>
                                <p className="mt-1 text-sm text-[#6f7488]">Fin : {formatDate(project.endDate)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <CircleDollarSign className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase  text-[#8f93a9]">Budget</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">
                                    {formatAmount(project.budgetAmount)}
                                </p>
                                <p className="mt-1 text-sm text-[#6f7488]">{project.billingMode || "Mode non renseigné"}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <div className="mb-3 inline-flex rounded-2xl bg-[#f1f3fa] p-2 text-[#5f667f]">
                                    <UserRound className="h-5 w-5" />
                                </div>
                                <p className="text-xs uppercase  text-[#8f93a9]">Pilotage</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatOwner(project)}</p>
                                <p className="mt-1 text-sm text-[#6f7488]">Créé le {formatDate(project.createdAt, true)}</p>
                            </div>
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase  text-[#8f93a9]">Revenu prévisionnel</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatAmount(project.revenueAmount)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase  text-[#8f93a9]">Coût projet</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatAmount(project.costAmount)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase  text-[#8f93a9]">Marge estimée</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatAmount(marginAmount)}</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase  text-[#8f93a9]">Reste à encaisser</p>
                                <p className="mt-2 text-sm font-semibold text-[#1e2234]">{formatAmount(outstandingAmount)}</p>
                            </div>
                        </div>
                    </div>
                </MotionReveal>

                <div className="grid gap-6">
                    <MotionReveal delay={40}>
                        <ProjectTaskProgress
                            projectId={project.id}
                            currentUserId={currentUserId}
                            kahierCategoryId={project.kahierCategoryId}
                            kahierTabId={project.kahierTabId}
                            initialProgress={project.progress}
                            initialTaskCompletionState={project.kahierTaskCompletionState}
                            canEdit={canEdit}
                        />
                    </MotionReveal>

                    <MotionReveal delay={80}>
                        <section className="space-y-6" id="project-details">
                            <Card className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition">
                                <CardHeader>
                                    <CardTitle className="text-xl text-slate-950">Détail du projet</CardTitle>
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

                </div>
            </div>
        </DashboardShell>
    );
}
