import type { ClientSegment, ClientStatus, Prisma, RevenueSource } from "@kahier/db-crm";

export type ListParams = {
    q?: string;
    status?: ClientStatus | string;
    segment?: ClientSegment | string;
    location?: string;
    assignedUserId?: string;
    companyId: string;
    page: number;
    pageSize: number;
};

export type ListItem = {
    id: string;
    name: string;
    status: ClientStatus;
    segment: ClientSegment;
    revenueSource: RevenueSource | null;
    location: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    siren: string | null;
    vatNumber: string | null;
    notes: string | null;
    contactsCount: number;
    owner: { firstName: string | null; lastName: string | null; email: string | null } | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
    emails: string[];
    phones: string[];
    interactions: {
        id: string;
        type: string;
        summary: string | null;
        occurredAt: Date;
        user?: { firstName: string | null; lastName: string | null; email: string | null } | null;
        collaborators?: { firstName: string | null; lastName: string | null; email: string | null }[];
        meetingStart?: Date | null;
        meetingEnd?: Date | null;
    }[];
};

export type ListResponse = {
    items: ListItem[];
    total: number;
    page: number;
    pageSize: number;
};

export type ClientWithRelations = Prisma.ClientGetPayload<{
    include: {
        contacts: true;
        projects: {
            select: {
                id: true;
                name: true;
                status: true;
                priority: true;
                progress: true;
                revenueAmount: true;
                costAmount: true;
                invoicedAmount: true;
                receivedAmount: true;
                endDate: true;
            };
            orderBy: { updatedAt: "desc" };
        };
        owner: { select: { firstName: true; lastName: true; email: true } };
        owners: { select: { userId: true; user: { select: { firstName: true; lastName: true; email: true } } } };
        interactions: {
            orderBy: { occurredAt: "desc" };
            include: {
                user: { select: { firstName: true; lastName: true; email: true } };
                collaborators: { select: { firstName: true; lastName: true; email: true } };
            };
        };
    };
}>;
