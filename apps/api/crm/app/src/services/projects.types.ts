import type { Prisma, ProjectPriority, ProjectStatus } from "@kahier/db-crm";

export type ListParams = {
    q?: string;
    status?: ProjectStatus | string;
    priority?: ProjectPriority | string;
    clientId?: string;
    assignedUserId?: string;
    companyId: string;
    page: number;
    pageSize: number;
};

export type ListItem = {
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
    status: ProjectStatus;
    priority: ProjectPriority;
    progress: number;
    budgetAmount: number | null;
    revenueAmount: number | null;
    costAmount: number | null;
    invoicedAmount: number | null;
    receivedAmount: number | null;
    billingMode: string | null;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    client: { id: string; name: string } | null;
    owner: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type ListResponse = {
    items: ListItem[];
    total: number;
    page: number;
    pageSize: number;
};

export type ProjectWithRelations = Prisma.ProjectGetPayload<{
    include: {
        client: { select: { id: true; name: true } };
        owner: { select: { id: true; firstName: true; lastName: true; email: true } };
    };
}>;
