import Link from "next/link";
import { BriefcaseBusiness, CalendarRange, Clock3, Eye, PencilLine, Plus, Target } from "lucide-react";
import { requireAuth } from "@/lib/authz";
import { getServerApiBase } from "@/lib/api-base";
import { MotionReveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardShell, fetchDashboardData } from "../_components";
import { DeleteProjectDialog } from "./_components/delete-project-dialog";

type ApiSummary = {
    total: number;
    draft: number;
    inProgress: number;
    onHold: number;
    completed: number;
    highPriority: number;
    dueSoon: number;
};

type ProjectItem = {
    id: string;
    name: string;
    description: string | null;
    status: "DRAFT" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";
    priority: "LOW" | "MEDIUM" | "HIGH";
    progress: number;
    startDate: string | null;
    endDate: string | null;
    kahierTabId: number | null;
    kahierCategoryId: number | null;
    revenueAmount: number | null;
    costAmount: number | null;
    invoicedAmount: number | null;
    receivedAmount: number | null;
    createdAt: string;
    updatedAt: string;
    client: { id: string; name: string } | null;
    owner: { id: string; firstName: string; lastName: string; email: string } | null;
};

type ProjectsResponse = {
    items: ProjectItem[];
    total: number;
    page: number;
    pageSize: number;
};

const STATUS_META = {
    DRAFT: {
        label: "En cadrage",
        badgeTone: "bg-white text-slate-700 border-slate-200",
    },
    IN_PROGRESS: {
        label: "En production",
        badgeTone: "bg-white text-slate-700 border-slate-200",
    },
    ON_HOLD: {
        label: "En pause",
        badgeTone: "bg-white text-slate-700 border-slate-200",
    },
    COMPLETED: {
        label: "Clôturé",
        badgeTone: "bg-white text-slate-700 border-slate-200",
    },
} as const;

async function fetchProjects(apiBase: string, currentUserId: string): Promise<ProjectsResponse | null> {
    try {
        const response = await fetch(`${apiBase}/projects?page=1&pageSize=100`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!response.ok) return null;
        return (await response.json()) as ProjectsResponse;
    } catch {
        return null;
    }
}

async function fetchSummary(apiBase: string, currentUserId: string): Promise<ApiSummary | null> {
    try {
        const response = await fetch(`${apiBase}/projects/summary`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!response.ok) return null;
        return (await response.json()) as ApiSummary;
    } catch {
        return null;
    }
}

function formatDate(value: string | null) {
    if (!value) return "Non planifiée";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Non planifiée";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default async function ProjectsPage() {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";
    const currentUserRole = session.user?.role ?? "USER";
    const firstName = session.user?.firstName?.trim() || "équipe";
    const apiBase = getServerApiBase();
    const { summary: dashboardSummary, interactions, clients, projects: searchProjects } = await fetchDashboardData(currentUserId);

    const [projectsData, summaryData] = apiBase
        ? await Promise.all([fetchProjects(apiBase, currentUserId), fetchSummary(apiBase, currentUserId)])
        : [null, null];

    const projects = projectsData?.items ?? [];
    const summary = summaryData ?? {
        total: projects.length,
        draft: projects.filter((project) => project.status === "DRAFT").length,
        inProgress: projects.filter((project) => project.status === "IN_PROGRESS").length,
        onHold: projects.filter((project) => project.status === "ON_HOLD").length,
        completed: projects.filter((project) => project.status === "COMPLETED").length,
        highPriority: projects.filter((project) => project.priority === "HIGH").length,
        dueSoon: projects.filter((project) => project.endDate).length,
    };

    const activeProjects = projects.filter((project) => project.status !== "COMPLETED").length;
    const averageProgress = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;
    const hasApiIssue = !apiBase || projectsData === null || summaryData === null;

    return (
        <DashboardShell
            firstName={firstName}
            email={session.user?.email}
            summary={dashboardSummary}
            interactionsCount={interactions.length}
            activeMenu="projects"
            searchClients={clients}
            searchInteractions={interactions}
            searchProjects={searchProjects}
        >
            <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
                <MotionReveal>
                    <section className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-[#1e2234] md:text-3xl">Projets</h1>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button asChild className="h-10 rounded-full bg-[#111322] px-4 text-white hover:bg-[#191d2e]">
                                    <Link href="/dashboard/projects/new">
                                        <Plus className="h-4 w-4" />
                                        Nouveau projet
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-2 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: "Actifs", value: activeProjects, icon: BriefcaseBusiness },
                                { label: "Avancement moyen", value: `${averageProgress}%`, icon: Target },
                                { label: "Haute priorité", value: summary.highPriority, icon: Clock3 },
                                { label: "Échéances", value: summary.dueSoon, icon: CalendarRange },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="rounded-[24px] border border-white/70 bg-white p-3 shadow-sm sm:p-5">
                                    <Icon className="h-3.5 w-3.5 text-slate-500 sm:h-4 sm:w-4" />
                                    <p className="mt-3 text-xs text-slate-500 sm:mt-4 sm:text-sm">{label}</p>
                                    <p className="mt-1 text-lg font-semibold text-slate-950 sm:text-2xl">{value}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </MotionReveal>

                <MotionReveal delay={80}>
                    <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <h2 className="text-2xl font-semibold text-slate-950">Liste des projets</h2>
                            <Badge variant="secondary" className="border border-[#d7dced] bg-[#f7f8fc] text-[#2f3344]">
                                {summary.total} projets
                            </Badge>
                        </div>

                        {hasApiIssue ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600">Données indisponibles.</div>
                        ) : projects.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">Aucun projet.</div>
                        ) : (
                            <>
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                                            <tr>
                                                <th className="px-3 py-3 font-medium">Projet</th>
                                                <th className="px-3 py-3 font-medium">Client</th>
                                                <th className="px-3 py-3 font-medium">Statut</th>
                                                <th className="px-3 py-3 font-medium">Dernière maj</th>
                                                <th className="px-3 py-3 font-medium">Échéance</th>
                                                <th className="px-3 py-3 text-right font-medium">Avancement</th>
                                                <th className="px-3 py-3 text-right font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {projects.map((project) => {
                                                const canEditProject = currentUserRole === "ADMIN" || project.owner?.id === currentUserId;
                                                return (
                                                    <tr key={project.id} className="transition hover:bg-slate-50">
                                                        <td className="px-3 py-4">
                                                            <Link href={`/dashboard/projects/${project.id}`} className="font-semibold text-slate-950">
                                                                {project.name}
                                                            </Link>
                                                        </td>
                                                        <td className="px-3 py-4 text-slate-700">{project.client?.name ?? "Sans client"}</td>
                                                        <td className="px-3 py-4">
                                                            <Badge variant="outline" className={STATUS_META[project.status].badgeTone}>
                                                                {STATUS_META[project.status].label}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-4 text-slate-600">{formatDate(project.updatedAt)}</td>
                                                        <td className="px-3 py-4 text-slate-600">{formatDate(project.endDate)}</td>
                                                        <td className="px-3 py-4 text-right font-semibold text-slate-950">{project.progress}%</td>
                                                        <td className="px-3 py-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Voir le projet">
                                                                    <Link href={`/dashboard/projects/${project.id}`}>
                                                                        <Eye className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                                {canEditProject && (
                                                                    <>
                                                                        <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Modifier le projet">
                                                                            <Link href={`/dashboard/projects/${project.id}/edit`}>
                                                                                <PencilLine className="h-4 w-4" />
                                                                            </Link>
                                                                        </Button>
                                                                        <DeleteProjectDialog
                                                                            projectId={project.id}
                                                                            projectName={project.name}
                                                                            currentUserId={currentUserId}
                                                                            kahierCategoryId={project.kahierCategoryId}
                                                                            kahierTabId={project.kahierTabId}
                                                                            redirectTo="/dashboard/projects"
                                                                            triggerClassName="h-10 w-10 rounded-full"
                                                                            triggerLabel="Supprimer"
                                                                            triggerIconOnly
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="space-y-3 md:hidden">
                                    {projects.map((project) => {
                                        const canEditProject = currentUserRole === "ADMIN" || project.owner?.id === currentUserId;
                                        return (
                                            <div key={project.id} className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <Link href={`/dashboard/projects/${project.id}`} className="truncate text-sm font-semibold text-slate-950">
                                                            {project.name}
                                                        </Link>
                                                        <p className="mt-1 text-sm text-slate-600">{project.client?.name ?? "Sans client"}</p>
                                                    </div>
                                                    <Badge variant="outline" className={STATUS_META[project.status].badgeTone}>
                                                        {STATUS_META[project.status].label}
                                                    </Badge>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                                                    <span className="rounded-full bg-slate-50 px-3 py-2">MAJ {formatDate(project.updatedAt)}</span>
                                                    <span className="rounded-full bg-slate-50 px-3 py-2 text-right">Échéance {formatDate(project.endDate)}</span>
                                                </div>
                                                <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                                                    <div className="h-1.5 rounded-full bg-slate-950" style={{ width: `${project.progress}%` }} />
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Voir le projet">
                                                        <Link href={`/dashboard/projects/${project.id}`}>
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    {canEditProject && (
                                                        <>
                                                            <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Modifier le projet">
                                                                <Link href={`/dashboard/projects/${project.id}/edit`}>
                                                                    <PencilLine className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <DeleteProjectDialog
                                                                projectId={project.id}
                                                                projectName={project.name}
                                                                currentUserId={currentUserId}
                                                                kahierCategoryId={project.kahierCategoryId}
                                                                kahierTabId={project.kahierTabId}
                                                                redirectTo="/dashboard/projects"
                                                                triggerClassName="h-10 w-10 rounded-full"
                                                                triggerLabel="Supprimer"
                                                                triggerIconOnly
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </section>
                </MotionReveal>

            </main>
        </DashboardShell>
    );
}
