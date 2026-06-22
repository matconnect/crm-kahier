import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, CalendarRange, Clock3, Layers3, Plus, Target } from "lucide-react";
import { requireAuth } from "@/lib/authz";
import { getServerApiBase } from "@/lib/api-base";
import { MotionReveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { DashboardShell, fetchDashboardData } from "../_components";

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
        columnTone: "bg-slate-100 text-slate-700",
        badgeTone: "bg-slate-50 text-slate-700",
    },
    IN_PROGRESS: {
        label: "En production",
        columnTone: "bg-slate-100 text-slate-700",
        badgeTone: "bg-slate-50 text-slate-700",
    },
    ON_HOLD: {
        label: "En pause",
        columnTone: "bg-slate-100 text-slate-700",
        badgeTone: "bg-slate-50 text-slate-700",
    },
    COMPLETED: {
        label: "Clôturé",
        columnTone: "bg-slate-100 text-slate-700",
        badgeTone: "bg-slate-100 text-slate-700",
    },
} as const;

const PRIORITY_META = {
    LOW: "Basse",
    MEDIUM: "Moyenne",
    HIGH: "Haute",
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

function formatPerson(project: ProjectItem) {
    const first = project.owner?.firstName?.trim() ?? "";
    const last = project.owner?.lastName?.trim() ?? "";
    const full = `${first} ${last}`.trim();
    return full || project.owner?.email || "Non assigné";
}

function formatDate(value: string | null) {
    if (!value) return "Non planifiée";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Non planifiée";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatAmount(value: number | null | undefined) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    return `${value.toLocaleString("fr-FR")} €`;
}

export default async function ProjectsPage() {
    const session = await requireAuth();
    const currentUserId = session.user?.id ?? "";
    const firstName = session.user?.firstName?.trim() || "équipe";
    const apiBase = getServerApiBase();
    const { summary: dashboardSummary, interactions, clients, projects: searchProjects } = await fetchDashboardData(currentUserId);

    const [projectsData, summaryData] = apiBase
        ? await Promise.all([
              fetchProjects(apiBase, currentUserId),
              fetchSummary(apiBase, currentUserId),
          ])
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
    const deliveryRate = projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0;
    const upcomingProjects = [...projects]
        .filter((project) => project.endDate && project.status !== "COMPLETED")
        .sort((a, b) => new Date(a.endDate ?? 0).getTime() - new Date(b.endDate ?? 0).getTime())
        .slice(0, 4);
    const recentlyUpdated = [...projects]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6);
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
                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-3">
                                <div>
                                    <h1 className="text-2xl font-bold  md:text-3xl">Projets</h1>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href="/dashboard/clients"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 text-sm font-medium text-[#2f3344] shadow-sm hover:bg-[#f8f9fd]"
                                >
                                    Voir les clients
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/dashboard/projects/new"
                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#111322] px-4 text-sm font-medium text-white hover:bg-[#191d2e]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Nouveau projet
                                </Link>
                            </div>
                        </div>

                        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                                    <BriefcaseBusiness className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Actifs</p>
                                <p className="mt-2 text-3xl font-semibold text-[#1e2234]">{activeProjects}</p>
                            </div>

                            <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                                    <Target className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Avancement moyen</p>
                                <p className="mt-2 text-3xl font-semibold text-[#1e2234]">{deliveryRate}%</p>
                            </div>

                            <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                                    <Clock3 className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Priorité haute</p>
                                <p className="mt-2 text-3xl font-semibold text-[#1e2234]">{summary.highPriority}</p>
                            </div>

                            <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <div className="mb-3 inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                                    <CalendarRange className="h-4 w-4" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">Échéances proches</p>
                                <p className="mt-2 text-3xl font-semibold text-[#1e2234]">{summary.dueSoon}</p>
                            </div>
                        </div>
                    </section>
                </MotionReveal>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                    <div className="space-y-6">
                        <MotionReveal delay={70}>
                            <section id="projects-overview" className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-slate-950">Vue d’ensemble</h2>
                                    </div>
                                    <Badge variant="secondary" className="border border-[#d7dced] bg-[#f7f8fc] text-[#2f3344]">
                                        {summary.total} projets
                                    </Badge>
                                </div>

                                {hasApiIssue ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                                        Données indisponibles.
                                    </div>
                                ) : projects.length === 0 ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                                        Aucun projet.
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid gap-4 md:grid-cols-4">
                                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-[#fafbff] p-4">
                                                <p className="text-xs uppercase  text-slate-500">En cadrage</p>
                                                <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.draft}</p>
                                            </div>
                                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-[#fafbff] p-4">
                                                <p className="text-xs uppercase  text-slate-500">En production</p>
                                                <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.inProgress}</p>
                                            </div>
                                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-[#fafbff] p-4">
                                                <p className="text-xs uppercase  text-slate-500">En pause</p>
                                                <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.onHold}</p>
                                            </div>
                                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-[#fafbff] p-4">
                                                <p className="text-xs uppercase  text-slate-500">Clôturés</p>
                                                <p className="mt-3 text-3xl font-semibold text-slate-950">{summary.completed}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-base font-semibold text-slate-950">Dernières mises à jour</h3>
                                                <span className="text-xs uppercase  text-slate-400">Réel</span>
                                            </div>
                                            <div className="space-y-3">
                                                {recentlyUpdated.map((project) => (
                                                    <Link
                                                        key={project.id}
                                                        href={`/dashboard/projects/${project.id}`}
                                                        className="block rounded-[1.5rem] border border-slate-200 bg-white/80 p-4 transition hover:border-slate-300 hover:bg-white"
                                                    >
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div className="space-y-1">
                                                                <h3 className="text-sm font-semibold text-slate-950">{project.name}</h3>
                                                                <p className="text-xs text-slate-500">
                                                                    {project.client?.name ?? "Sans client"} · {formatPerson(project)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className={STATUS_META[project.status].badgeTone}>
                                                                    {STATUS_META[project.status].label}
                                                                </Badge>
                                                                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                                                    {PRIORITY_META[project.priority]}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <p className="mt-2 text-xs text-slate-500">
                                                            Revenu {formatAmount(project.revenueAmount)} · Coût {formatAmount(project.costAmount)}
                                                        </p>
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
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </section>
                        </MotionReveal>

                        <MotionReveal delay={130}>
                            <section id="projects-pipeline" className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-6">
                                <div className="mb-5">
                                        <h2 className="text-2xl font-semibold text-slate-950">État des projets</h2>
                                </div>

                                {hasApiIssue ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
                                        Impossible de charger le pipeline projet.
                                    </div>
                                ) : (
                                    <div className="grid gap-4 xl:grid-cols-4">
                                        {Object.entries(STATUS_META).map(([status, meta]) => {
                                            const items = projects.filter((project) => project.status === status);
                                            return (
                                                <div key={status} className="rounded-[1.5rem] border border-slate-200 bg-white/60 p-4">
                                                    <div className="mb-4 flex items-center justify-between">
                                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${meta.columnTone}`}>
                                                            {meta.label}
                                                        </span>
                                                        <span className="text-xs text-slate-500">{items.length}</span>
                                                    </div>

                                                    {items.length === 0 ? (
                                                        <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-white/70 p-4 text-sm text-slate-500">
                                                            Vide.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {items.map((project) => (
                                                                <Link
                                                                    key={project.id}
                                                                    href={`/dashboard/projects/${project.id}`}
                                                                    className="block rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] transition hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                                                                >
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div>
                                                                            <h3 className="text-sm font-semibold text-slate-950">{project.name}</h3>
                                                                            <p className="mt-1 text-xs text-slate-500">
                                                                                {project.client?.name ?? "Sans client"}
                                                                            </p>
                                                                        </div>
                                                                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                                                            {PRIORITY_META[project.priority]}
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

                                                                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                                                        <span>{formatPerson(project)}</span>
                                                                        <span>{formatDate(project.endDate)}</span>
                                                                    </div>
                                                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                                                        <span>Revenu {formatAmount(project.revenueAmount)}</span>
                                                                        <span>Coût {formatAmount(project.costAmount)}</span>
                                                                    </div>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </MotionReveal>
                    </div>

                    <MotionReveal delay={110}>
                        <aside id="projects-planning" className="space-y-6 xl:sticky xl:top-28">
                            <section className="h-fit rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-slate-950">Échéances proches</h2>
                                    </div>

                                    {hasApiIssue ? (
                                        <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-sm text-slate-600">
                                            Indisponible.
                                        </div>
                                    ) : upcomingProjects.length === 0 ? (
                                        <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-sm text-slate-600">
                                            Aucune échéance.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {upcomingProjects.map((project) => (
                                                <Link
                                                    key={project.id}
                                                    href={`/dashboard/projects/${project.id}`}
                                                    className="block rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="rounded-2xl bg-[#eef1fb] p-2 text-[#5f667f]">
                                                            <CalendarRange className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-950">{project.name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {formatDate(project.endDate)} · {project.client?.name ?? "Sans client"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}

                                    <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-[#f7f8fc] px-4 py-4">
                                        <p className="text-sm font-medium text-[#1e2234]">{summary.dueSoon} échéance(s)</p>
                                    </div>

                                    <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                                        <div className="flex items-center gap-2 text-slate-950">
                                            <Layers3 className="h-4 w-4 text-slate-700" />
                                            <span className="text-sm font-medium">CRM</span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-600">{summary.inProgress} production · {summary.completed} clôturé(s)</p>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-slate-950">Nouvelle fiche projet</h2>
                                    </div>
                                    <Link
                                        href="/dashboard/projects/new"
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#111322] px-4 text-sm font-medium text-white hover:bg-[#191d2e]"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Créer un projet détaillé
                                    </Link>
                                </div>
                            </section>
                        </aside>
                    </MotionReveal>
                </div>
            </main>
        </DashboardShell>
    );
}
