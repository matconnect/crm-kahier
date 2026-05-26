import { prisma } from "@kahier/db-crm";
import { ProjectPriority, ProjectStatus, type Prisma } from "@kahier/db-crm";
import type { ListItem, ListParams, ListResponse, ProjectWithRelations } from "./projects.types.js";

export async function list(params: ListParams): Promise<ListResponse> {
    const { q = "", status, priority, clientId, page, pageSize, companyId, assignedUserId } = params;
    const skip = (page - 1) * pageSize;

    const statusFilter = isProjectStatus(status) ? status : undefined;
    const priorityFilter = isProjectPriority(priority) ? priority : undefined;

    const where: Prisma.ProjectWhereInput = {
        companyId,
        ...(assignedUserId ? { ownerId: assignedUserId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(priorityFilter ? { priority: priorityFilter } : {}),
        ...(clientId ? { clientId } : {}),
        ...(q
            ? {
                OR: [
                    { name: { contains: q } },
                    { description: { contains: q } },
                    { client: { is: { name: { contains: q } } } },
                ],
            }
            : {}),
    };

    const [items, total] = await Promise.all([
        prisma.project.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: [{ status: "asc" }, { endDate: "asc" }, { createdAt: "desc" }],
            include: {
                client: { select: { id: true, name: true } },
                owner: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
        }),
        prisma.project.count({ where }),
    ]);

    const formatted: ListItem[] = items.map((project) => ({
        id: project.id,
        name: project.name,
        reference: project.reference ?? null,
        description: project.description ?? null,
        context: project.context ?? null,
        goals: project.goals ?? null,
        deliverables: project.deliverables ?? null,
        successMetrics: project.successMetrics ?? null,
        risks: project.risks ?? null,
        notes: project.notes ?? null,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        budgetAmount: project.budgetAmount ?? null,
        revenueAmount: project.revenueAmount ?? null,
        costAmount: project.costAmount ?? null,
        invoicedAmount: project.invoicedAmount ?? null,
        receivedAmount: project.receivedAmount ?? null,
        billingMode: project.billingMode ?? null,
        startDate: project.startDate ?? null,
        endDate: project.endDate ?? null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        client: project.client,
        owner: project.owner,
    }));

    return { items: formatted, total, page, pageSize };
}

export async function summary(companyId: string) {
    const now = new Date();
    const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [total, draft, inProgress, onHold, completed, highPriority, dueSoon, financials] = await Promise.all([
        prisma.project.count({ where: { companyId } }),
        prisma.project.count({ where: { companyId, status: "DRAFT" } }),
        prisma.project.count({ where: { companyId, status: "IN_PROGRESS" } }),
        prisma.project.count({ where: { companyId, status: "ON_HOLD" } }),
        prisma.project.count({ where: { companyId, status: "COMPLETED" } }),
        prisma.project.count({ where: { companyId, priority: "HIGH" } }),
        prisma.project.count({
            where: {
                companyId,
                endDate: { gte: now, lte: inSevenDays },
                status: { not: "COMPLETED" },
            },
        }),
        prisma.project.aggregate({
            where: { companyId },
            _sum: {
                revenueAmount: true,
                costAmount: true,
                invoicedAmount: true,
                receivedAmount: true,
            },
        }),
    ]);

    const plannedRevenue = financials._sum.revenueAmount ?? 0;
    const plannedCost = financials._sum.costAmount ?? 0;
    const invoiced = financials._sum.invoicedAmount ?? 0;
    const received = financials._sum.receivedAmount ?? 0;

    return {
        total,
        draft,
        inProgress,
        onHold,
        completed,
        highPriority,
        dueSoon,
        plannedRevenue,
        plannedCost,
        plannedMargin: plannedRevenue - plannedCost,
        invoiced,
        received,
        outstanding: invoiced - received,
    };
}

export async function create(input: Prisma.ProjectCreateInput) {
    return prisma.project.create({
        data: input,
        include: {
            client: { select: { id: true, name: true } },
            owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    });
}

export async function getById(id: string, companyId: string): Promise<ProjectWithRelations> {
    return prisma.project.findFirstOrThrow({
        where: { id, companyId },
        include: {
            client: { select: { id: true, name: true } },
            owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    });
}

export async function update(id: string, companyId: string, input: Prisma.ProjectUpdateInput) {
    await prisma.project.findFirstOrThrow({ where: { id, companyId }, select: { id: true } });
    return prisma.project.update({
        where: { id },
        data: input,
        include: {
            client: { select: { id: true, name: true } },
            owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
    });
}

export async function remove(id: string, companyId: string) {
    await prisma.project.findFirstOrThrow({ where: { id, companyId }, select: { id: true } });
    await prisma.project.delete({ where: { id } });
}

export async function assertClientBelongsToCompany(clientId: string, companyId: string) {
    await prisma.client.findFirstOrThrow({
        where: { id: clientId, companyId },
        select: { id: true },
    });
}

export async function assertUserBelongsToCompany(userId: string, companyId: string) {
    await prisma.user.findFirstOrThrow({
        where: { id: userId, companyId },
        select: { id: true },
    });
}

function isProjectStatus(value: unknown): value is ProjectStatus {
    return typeof value === "string" && Object.values(ProjectStatus).includes(value as ProjectStatus);
}

function isProjectPriority(value: unknown): value is ProjectPriority {
    return typeof value === "string" && Object.values(ProjectPriority).includes(value as ProjectPriority);
}
