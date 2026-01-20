import type { ClientSegment, ClientStatus, Prisma } from "@prisma/client";

export type ListParams = {
    q?: string;
    status?: ClientStatus | string;
    segment?: ClientSegment | string;
    location?: string;
    companyId: string;
    page: number;
    pageSize: number;
};

export type ListItem = {
    id: string;
    name: string;
    status: ClientStatus;
    segment: ClientSegment;
    location: string | null;
    notes: string | null;
    contactsCount: number;
    owner: { firstName: string | null; lastName: string | null; email: string | null } | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
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
        owner: { select: { firstName: true; lastName: true; email: true } };
        interactions: {
            orderBy: { occurredAt: "desc" };
            include: {
                user: { select: { firstName: true; lastName: true; email: true } };
                collaborators: { select: { firstName: true; lastName: true; email: true } };
            };
        };
    };
}>;
