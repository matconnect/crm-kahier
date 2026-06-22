import { prisma } from "@kahier/db-crm";
import { ClientSegment, ClientStatus, type Prisma } from "@kahier/db-crm";
import type { ClientWithRelations, ListItem, ListParams, ListResponse } from "./clients.types.js";

function normalizeStringArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}

export async function list(params: ListParams): Promise<ListResponse> {
    const { q = "", status, segment, location, page, pageSize, companyId, assignedUserId } = params;
    const skip = (page - 1) * pageSize;

    const statusFilter = isClientStatus(status) ? status : undefined;
    const segmentFilter = isClientSegment(segment) ? segment : undefined;

    const where: Prisma.ClientWhereInput = {
        companyId,
        ...(assignedUserId
            ? {
                  OR: [
                      { ownerId: assignedUserId },
                      { owners: { some: { userId: assignedUserId } } },
                  ],
              }
            : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(segmentFilter ? { segment: segmentFilter } : {}),
        ...(location ? { location } : {}),
        ...(q
            ? {
                OR: [
                    { name: { contains: q } },
                    { primaryEmail: { contains: q } },
                    { contacts: { some: { email: { contains: q } } } },
                    { contacts: { some: { firstName: { contains: q } } } },
                    { contacts: { some: { lastName: { contains: q } } } },
                ],
            }
            : {}),
    };

    const [items, total] = await Promise.all([
        prisma.client.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            include: {
                owner: { select: { id: true, firstName: true, lastName: true, email: true } },
                _count: { select: { contacts: true } },
                interactions: {
                    orderBy: { occurredAt: "desc" },
                    take: 10,
                    select: {
                        id: true,
                        type: true,
                        summary: true,
                        occurredAt: true,
                        meetingStart: true,
                        meetingEnd: true,
                        user: { select: { firstName: true, lastName: true, email: true } },
                        collaborators: { select: { firstName: true, lastName: true, email: true } },
                    },
                },
                contacts: { select: { email: true, phone: true }, take: 1 },
            },
        }),
        prisma.client.count({ where }),
    ]);

    // Shape front-friendly
    const formatted: ListItem[] = items.map((c) => {
        const emails = normalizeStringArray(c.emails);
        const phones = normalizeStringArray(c.phones);
        return {
        id: c.id,
        name: c.name,
        status: c.status,
        segment: c.segment,
        revenueSource: c.revenueSource ?? null,
        location: c.location,
        addressLine1: c.addressLine1 ?? null,
        addressLine2: c.addressLine2 ?? null,
        postalCode: c.postalCode ?? null,
        city: c.city ?? null,
        country: c.country ?? null,
        siren: c.siren ?? null,
        vatNumber: c.vatNumber ?? null,
        notes: c.notes ?? null,
        contactsCount: c._count.contacts,
        owner: c.owner ? { firstName: c.owner.firstName, lastName: c.owner.lastName, email: c.owner.email } : null,
        primaryEmail: c.primaryEmail ?? emails[0] ?? c.contacts[0]?.email ?? null,
        primaryPhone: c.primaryPhone ?? phones[0] ?? c.contacts[0]?.phone ?? null,
        emails,
        phones,
        interactions: c.interactions,
        };
    });

    return { items: formatted, total, page, pageSize };
}

export async function summary(companyId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
        total,
        active,
        inactive,
        prospects,
        interactions,
        interactionsWeek,
        interactionsPrevWeek,
        interactionsMonth,
        interactionsPrevMonth,
        clientsWeek,
        clientsPrevWeek,
        clientsMonth,
        clientsPrevMonth,
        prospectsWeek,
        prospectsPrevWeek,
        prospectsMonth,
        prospectsPrevMonth,
    ] = await Promise.all([
        prisma.client.count({ where: { companyId } }),
        prisma.client.count({ where: { status: "ACTIVE", companyId } }),
        prisma.client.count({ where: { status: "INACTIVE", companyId } }),
        prisma.client.count({ where: { status: "PROSPECT", companyId } }),
        prisma.clientInteraction.count({ where: { client: { companyId } } }),
        prisma.clientInteraction.count({ where: { occurredAt: { gte: weekAgo }, client: { companyId } } }),
        prisma.clientInteraction.count({
            where: { occurredAt: { gte: twoWeeksAgo, lt: weekAgo }, client: { companyId } },
        }),
        prisma.clientInteraction.count({ where: { occurredAt: { gte: monthAgo }, client: { companyId } } }),
        prisma.clientInteraction.count({
            where: { occurredAt: { gte: twoMonthsAgo, lt: monthAgo }, client: { companyId } },
        }),
        prisma.client.count({ where: { createdAt: { gte: weekAgo }, companyId } }),
        prisma.client.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo }, companyId } }),
        prisma.client.count({ where: { createdAt: { gte: monthAgo }, companyId } }),
        prisma.client.count({ where: { createdAt: { gte: twoMonthsAgo, lt: monthAgo }, companyId } }),
        prisma.client.count({ where: { status: "PROSPECT", createdAt: { gte: weekAgo }, companyId } }),
        prisma.client.count({
            where: { status: "PROSPECT", createdAt: { gte: twoWeeksAgo, lt: weekAgo }, companyId },
        }),
        prisma.client.count({ where: { status: "PROSPECT", createdAt: { gte: monthAgo }, companyId } }),
        prisma.client.count({
            where: { status: "PROSPECT", createdAt: { gte: twoMonthsAgo, lt: monthAgo }, companyId },
        }),
    ]);

    return {
        total,
        active,
        inactive,
        prospects,
        interactions,
        interactionsWeek,
        interactionsPrevWeek,
        interactionsMonth,
        interactionsPrevMonth,
        clientsWeek,
        clientsPrevWeek,
        clientsMonth,
        clientsPrevMonth,
        prospectsWeek,
        prospectsPrevWeek,
        prospectsMonth,
        prospectsPrevMonth,
    };
}

export async function create(input: Prisma.ClientCreateArgs["data"] & { companyId: string }) {
    return prisma.client.create({ data: input });
}

export async function getById(id: string, companyId: string): Promise<ClientWithRelations> {
    return prisma.client.findFirstOrThrow({
        where: { id, companyId },
        include: {
            contacts: true,
            projects: {
                orderBy: { updatedAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    status: true,
                    priority: true,
                    progress: true,
                    revenueAmount: true,
                    costAmount: true,
                    invoicedAmount: true,
                    receivedAmount: true,
                    endDate: true,
                },
            },
            owner: { select: { firstName: true, lastName: true, email: true } },
            owners: { select: { userId: true, user: { select: { firstName: true, lastName: true, email: true } } } },
            interactions: {
                orderBy: { occurredAt: "desc" },
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                    collaborators: { select: { firstName: true, lastName: true, email: true } },
                },
            },
        },
    });
}

export async function update(id: string, companyId: string, input: Prisma.ClientUpdateArgs["data"]) {
    return prisma.client.update({ where: { id, companyId }, data: input });
}

export async function remove(id: string, companyId: string) {
    await prisma.client.delete({ where: { id, companyId } });
}

export async function addInteraction(
    clientId: string,
    companyId: string,
    input: {
        type: string;
        summary?: string | null;
        occurredAt?: Date;
        userId?: string | null;
        collaboratorIds?: string[] | null;
        meetingStart?: Date | null;
        meetingEnd?: Date | null;
    },
) {
    await prisma.client.findFirstOrThrow({ where: { id: clientId, companyId } });
    const occurredAt = input.occurredAt ?? new Date();
    const summary = input.summary?.trim() || null;
    return prisma.clientInteraction.create({
        data: {
            clientId,
            type: input.type,
            summary,
            occurredAt,
            userId: input.userId ?? null,
            ...(input.collaboratorIds && input.collaboratorIds.length
                ? { collaborators: { connect: input.collaboratorIds.map((id) => ({ id })) } }
                : {}),
            meetingStart: input.meetingStart ?? null,
            meetingEnd: input.meetingEnd ?? null,
        },
    });
}

export async function updateInteraction(
    interactionId: string,
    companyId: string,
    input: {
        type?: string;
        summary?: string | null;
        occurredAt?: Date;
        userId?: string | null;
        collaboratorIds?: string[] | null;
        meetingStart?: Date | null;
        meetingEnd?: Date | null;
    },
) {
    const interaction = await prisma.clientInteraction.findUniqueOrThrow({
        where: { id: interactionId },
        include: { client: true },
    });
    if (interaction.client.companyId !== companyId) {
        throw new Error("Forbidden");
    }
    const data: Prisma.ClientInteractionUpdateInput = {
        ...(input.type ? { type: input.type } : {}),
        ...(input.summary !== undefined ? { summary: input.summary?.trim() || null } : {}),
        ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
        ...(input.userId !== undefined ? { userId: input.userId || null } : {}),
        ...(input.collaboratorIds !== undefined
            ? { collaborators: { set: (input.collaboratorIds ?? []).map((id) => ({ id })) } }
            : {}),
        ...(input.meetingStart !== undefined ? { meetingStart: input.meetingStart } : {}),
        ...(input.meetingEnd !== undefined ? { meetingEnd: input.meetingEnd } : {}),
    };
    return prisma.clientInteraction.update({ where: { id: interactionId }, data });
}

export async function deleteInteraction(interactionId: string, companyId: string) {
    const interaction = await prisma.clientInteraction.findUniqueOrThrow({
        where: { id: interactionId },
        include: { client: true },
    });
    if (interaction.client.companyId !== companyId) {
        throw new Error("Forbidden");
    }
    return prisma.clientInteraction.delete({ where: { id: interactionId } });
}

export async function addContact(
    clientId: string,
    companyId: string,
    input: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
        phone?: string | null;
        emails?: string[] | null;
        phones?: string[] | null;
        role?: string | null;
    },
) {
    await prisma.client.findFirstOrThrow({ where: { id: clientId, companyId } });
    const firstName = input.firstName?.trim() || "";
    const lastName = input.lastName?.trim() || "";
    const email = input.email?.trim() || null;
    const phone = input.phone?.trim() || null;
    const role = input.role?.trim() || null;
    const emails = input.emails ?? null;
    const phones = input.phones ?? null;

    return prisma.clientContact.create({
        data: {
            clientId,
            firstName: firstName || "Contact",
            lastName,
            email,
            phone,
            emails: emails ?? undefined,
            phones: phones ?? undefined,
            role,
        },
    });
}

export async function deleteContact(contactId: string, companyId: string) {
    const contact = await prisma.clientContact.findUniqueOrThrow({
        where: { id: contactId },
        include: { client: true },
    });
    if (contact.client.companyId !== companyId) {
        throw new Error("Forbidden");
    }
    return prisma.clientContact.delete({ where: { id: contactId } });
}

function isClientStatus(value: unknown): value is ClientStatus {
    return typeof value === "string" && Object.values(ClientStatus).includes(value as ClientStatus);
}

function isClientSegment(value: unknown): value is ClientSegment {
    return typeof value === "string" && Object.values(ClientSegment).includes(value as ClientSegment);
}
