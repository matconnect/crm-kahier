import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LayoutGrid, Save } from "lucide-react";

import { getServerApiBase } from "@/lib/api-base";
import { requireAuth } from "@/lib/authz";
import { MotionReveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { DashboardShell, fetchDashboardData } from "../../../_components";
import { ProjectForm, type ClientOption, type OwnerOption, type ProjectFormValues } from "../../new/create-project-form";

type EditPageProps = {
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
    client: { id: string; name: string } | null;
    owner: { id: string; firstName: string; lastName: string; email: string } | null;
};

async function fetchProject(apiBase: string, currentUserId: string, id: string): Promise<ProjectDetail | null> {
    const response = await fetch(`${apiBase}/projects/${id}`, {
        cache: "no-store",
        headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Impossible de récupérer le projet");
    return (await response.json()) as ProjectDetail;
}

async function fetchClients(apiBase: string, currentUserId: string): Promise<ClientOption[]> {
    try {
        const response = await fetch(`${apiBase}/clients?page=1&pageSize=100`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!response.ok) return [];
        const data = (await response.json()) as { items?: ClientOption[] };
        return data.items ?? [];
    } catch {
        return [];
    }
}

async function fetchOwners(apiBase: string, currentUserId: string, fallbackEmail?: string | null): Promise<OwnerOption[]> {
    try {
        const response = await fetch(`${apiBase}/users`, {
            cache: "no-store",
            headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
        });
        if (!response.ok) {
            return [{ id: currentUserId, label: fallbackEmail ?? "Moi", email: fallbackEmail }];
        }
        const data = (await response.json()) as { users?: OwnerOption[] };
        return data.users?.length ? data.users : [{ id: currentUserId, label: fallbackEmail ?? "Moi", email: fallbackEmail }];
    } catch {
        return [{ id: currentUserId, label: fallbackEmail ?? "Moi", email: fallbackEmail }];
    }
}

function toFormValues(project: ProjectDetail, currentUserId: string): ProjectFormValues {
    return {
        name: project.name,
        reference: project.reference ?? "",
        clientId: project.client?.id ?? "none",
        ownerId: project.owner?.id ?? currentUserId,
        status: project.status,
        priority: project.priority,
        progress: String(project.progress ?? 0),
        budgetAmount: project.budgetAmount === null ? "" : String(project.budgetAmount),
        revenueAmount: project.revenueAmount === null ? "" : String(project.revenueAmount),
        costAmount: project.costAmount === null ? "" : String(project.costAmount),
        invoicedAmount: project.invoicedAmount === null ? "" : String(project.invoicedAmount),
        receivedAmount: project.receivedAmount === null ? "" : String(project.receivedAmount),
        billingMode: project.billingMode ?? "",
        startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : "",
        description: project.description ?? "",
        context: project.context ?? "",
        goals: project.goals ?? "",
        deliverables: project.deliverables ?? "",
        successMetrics: project.successMetrics ?? "",
        risks: project.risks ?? "",
        notes: project.notes ?? "",
    };
}

export default async function EditProjectPage({ params }: EditPageProps) {
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

    const [project, clients, owners] = await Promise.all([
        fetchProject(apiBase, currentUserId, id),
        fetchClients(apiBase, currentUserId),
        fetchOwners(apiBase, currentUserId, session.user?.email),
    ]);

    if (!project) {
        notFound();
    }

    const canEdit = currentUserRole === "ADMIN" || project.owner?.id === currentUserId;
    if (!canEdit) {
        notFound();
    }

    const formValues = toFormValues(project, currentUserId);

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
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" id="project-form">
                <MotionReveal>
                    <div className="rounded-[28px] border border-white/70 bg-[#f8f9fd] px-6 py-7 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:px-8">
                        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#e1e4ef] bg-white px-3 py-1 text-xs text-[#6f7488]">
                                    Édition projet
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    Connecté : {session.user?.email}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-[#1f2335] md:text-3xl">Modifier {project.name}</h1>
                                    <p className="text-sm text-[#6f7488]">
                                        Mets à jour la fiche projet complète sans mélanger lecture et édition sur la même page.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={`/dashboard/projects/${project.id}`}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 py-2 text-sm font-medium text-[#2f3344]"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour fiche
                                </Link>
                                <Link
                                    href="/dashboard/projects"
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d7dced] bg-white px-4 py-2 text-sm font-medium text-[#2f3344]"
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                    Retour liste
                                </Link>
                                <Button asChild className="gap-2 rounded-full border-0 bg-[#111322] text-white hover:bg-[#191d2e]">
                                    <button type="submit" form="project-form">
                                        <Save className="h-4 w-4" />
                                        Enregistrer les modifications
                                    </button>
                                </Button>
                            </div>
                        </div>
                    </div>
                </MotionReveal>

                <MotionReveal delay={100}>
                    <ProjectForm
                        mode="edit"
                        projectId={project.id}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        clients={clients}
                        owners={owners}
                        initialValues={formValues}
                        onSuccessRedirect={`/dashboard/projects/${project.id}`}
                    />
                </MotionReveal>
            </div>
        </DashboardShell>
    );
}
