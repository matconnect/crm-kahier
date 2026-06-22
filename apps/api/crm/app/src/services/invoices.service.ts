import { InvoiceStatus, prisma, type Prisma } from "@kahier/db-crm";
import {
    formatInvoiceNumber,
    getEffectiveInvoiceStatus,
    isInvoiceStatus,
    isInvoiceStatusTransitionAllowed,
    validateInvoiceInput,
    type InvoiceStatusValue,
} from "./invoices.domain.js";
import type {
    InvoiceActor,
    InvoiceListParams,
    InvoiceMutationInput,
    InvoiceWithRelations,
    SerializedInvoice,
} from "./invoices.types.js";

const invoiceInclude = {
    client: {
        select: {
            id: true,
            name: true,
            location: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            city: true,
            country: true,
            siren: true,
            vatNumber: true,
            primaryEmail: true,
            primaryPhone: true,
        },
    },
    company: {
        select: {
            id: true,
            name: true,
            legalForm: true,
            capitalSocialCents: true,
            siren: true,
            siret: true,
            vatNumber: true,
            rcsCity: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            city: true,
            country: true,
            contactEmail: true,
            contactPhone: true,
            paymentTerms: true,
            latePenaltyRateBps: true,
            fixedCompensationCents: true,
        },
    },
    createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    lines: { orderBy: { position: "asc" as const } },
} satisfies Prisma.InvoiceInclude;

export class InvoiceDomainError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly details?: unknown,
    ) {
        super(message);
    }
}

function accessWhere(actor: InvoiceActor): Prisma.InvoiceWhereInput {
    const base: Prisma.InvoiceWhereInput = { companyId: actor.companyId };
    if (actor.role !== "USER") return base;
    return {
        ...base,
        OR: [
            { createdById: actor.id },
            {
                client: {
                    is: {
                        OR: [{ ownerId: actor.id }, { owners: { some: { userId: actor.id } } }],
                    },
                },
            },
        ],
    };
}

function clientAccessWhere(actor: InvoiceActor): Prisma.ClientWhereInput {
    return {
        companyId: actor.companyId,
        ...(actor.role === "USER"
            ? { OR: [{ ownerId: actor.id }, { owners: { some: { userId: actor.id } } }] }
            : {}),
    };
}

function assertValidInput(input: InvoiceMutationInput) {
    const result = validateInvoiceInput(input);
    if (!result.ok) throw new InvoiceDomainError("Données de facture invalides.", 400, result.errors);
    return result.data;
}

function invoiceToInput(invoice: InvoiceWithRelations): InvoiceMutationInput {
    return {
        clientId: invoice.clientId,
        status: invoice.status,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        paidAt: invoice.paidAt,
        notes: invoice.notes,
        lines: invoice.lines.map((line) => ({
            description: line.description,
            quantity: line.quantityMilli / 1_000,
            unitPrice: line.unitPriceCents / 100,
            vatRate: line.vatRateBps / 100,
        })),
    };
}

function buildIssuerSnapshot(company: InvoiceWithRelations["company"]) {
    return {
        name: company.name,
        legalForm: company.legalForm,
        capitalSocialCents: company.capitalSocialCents,
        siren: company.siren,
        siret: company.siret,
        vatNumber: company.vatNumber,
        rcsCity: company.rcsCity,
        addressLine1: company.addressLine1,
        addressLine2: company.addressLine2,
        postalCode: company.postalCode,
        city: company.city,
        country: company.country,
        contactEmail: company.contactEmail,
        contactPhone: company.contactPhone,
        paymentTerms: company.paymentTerms,
        latePenaltyRateBps: company.latePenaltyRateBps,
        fixedCompensationCents: company.fixedCompensationCents,
    };
}

function buildClientSnapshot(client: InvoiceWithRelations["client"]) {
    return {
        name: client.name,
        location: client.location,
        addressLine1: client.addressLine1,
        addressLine2: client.addressLine2,
        postalCode: client.postalCode,
        city: client.city,
        country: client.country,
        siren: client.siren,
        vatNumber: client.vatNumber,
        primaryEmail: client.primaryEmail,
        primaryPhone: client.primaryPhone,
    };
}

export function serializeInvoice(invoice: InvoiceWithRelations, now = new Date()): SerializedInvoice {
    const storedStatus = invoice.status as InvoiceStatusValue;
    return {
        ...invoice,
        storedStatus,
        status: getEffectiveInvoiceStatus(storedStatus, invoice.dueDate, now),
        lines: invoice.lines.map((line) => ({
            ...line,
            quantity: line.quantityMilli / 1_000,
            unitPrice: line.unitPriceCents / 100,
            vatRate: line.vatRateBps / 100,
        })),
    };
}

async function assertClientAccess(
    database: Prisma.TransactionClient | typeof prisma,
    clientId: string,
    actor: InvoiceActor,
) {
    const client = await database.client.findFirst({
        where: { ...clientAccessWhere(actor), id: clientId },
        select: { id: true },
    });
    if (!client) throw new InvoiceDomainError("Client introuvable ou inaccessible.", 400);
}

export async function list(actor: InvoiceActor, params: InvoiceListParams) {
    const page = Number.isFinite(params.page) ? Math.max(1, Math.floor(params.page)) : 1;
    const pageSize = Number.isFinite(params.pageSize) ? Math.min(100, Math.max(1, Math.floor(params.pageSize))) : 20;
    const now = new Date();
    const status = isInvoiceStatus(params.status) ? params.status : undefined;
    const statusFilter: Prisma.InvoiceWhereInput | undefined =
        status === "OVERDUE"
            ? { OR: [{ status: InvoiceStatus.OVERDUE }, { status: InvoiceStatus.SENT, dueDate: { lt: now } }] }
            : status === "SENT"
              ? { status: InvoiceStatus.SENT, dueDate: { gte: now } }
              : status
                ? { status: status as InvoiceStatus }
                : undefined;

    const q = params.q?.trim() ?? "";
    const where: Prisma.InvoiceWhereInput = {
        AND: [
            accessWhere(actor),
            ...(statusFilter ? [statusFilter] : []),
            ...(params.clientId ? [{ clientId: params.clientId }] : []),
            ...(q
                ? [
                      {
                          OR: [
                              { number: { contains: q } },
                              { client: { is: { name: { contains: q } } } },
                          ],
                      },
                  ]
                : []),
        ],
    };

    const [items, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            include: invoiceInclude,
            orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.invoice.count({ where }),
    ]);

    return { items: items.map((invoice) => serializeInvoice(invoice, now)), total, page, pageSize };
}

export async function summary(actor: InvoiceActor) {
    const now = new Date();
    const base = accessWhere(actor);
    const activeAmountsWhere: Prisma.InvoiceWhereInput = {
        AND: [base, { status: { not: InvoiceStatus.CANCELLED } }],
    };
    const outstandingAmountsWhere: Prisma.InvoiceWhereInput = {
        AND: [
            base,
            {
                OR: [
                    { status: InvoiceStatus.SENT, dueDate: { gte: now } },
                    { status: InvoiceStatus.OVERDUE },
                    { status: InvoiceStatus.SENT, dueDate: { lt: now } },
                ],
            },
        ],
    };

    const [total, draft, sent, paid, overdue, cancelled, amounts, paidAmounts, outstandingAmounts] = await Promise.all([
        prisma.invoice.count({ where: base }),
        prisma.invoice.count({ where: { AND: [base, { status: InvoiceStatus.DRAFT }] } }),
        prisma.invoice.count({
            where: { AND: [base, { status: InvoiceStatus.SENT, dueDate: { gte: now } }] },
        }),
        prisma.invoice.count({ where: { AND: [base, { status: InvoiceStatus.PAID }] } }),
        prisma.invoice.count({
            where: {
                AND: [
                    base,
                    { OR: [{ status: InvoiceStatus.OVERDUE }, { status: InvoiceStatus.SENT, dueDate: { lt: now } }] },
                ],
            },
        }),
        prisma.invoice.count({ where: { AND: [base, { status: InvoiceStatus.CANCELLED }] } }),
        prisma.invoice.aggregate({ where: activeAmountsWhere, _sum: { subtotalCents: true, vatCents: true, totalCents: true } }),
        prisma.invoice.aggregate({
            where: { AND: [base, { status: InvoiceStatus.PAID }] },
            _sum: { totalCents: true },
        }),
        prisma.invoice.aggregate({
            where: outstandingAmountsWhere,
            _sum: { totalCents: true },
        }),
    ]);

    const totalCents = amounts._sum.totalCents ?? 0;
    const paidCents = paidAmounts._sum.totalCents ?? 0;
    return {
        total,
        draft,
        sent,
        paid,
        overdue,
        cancelled,
        subtotalCents: amounts._sum.subtotalCents ?? 0,
        vatCents: amounts._sum.vatCents ?? 0,
        totalCents,
        paidCents,
        outstandingCents: outstandingAmounts._sum.totalCents ?? 0,
    };
}

export async function create(actor: InvoiceActor, input: InvoiceMutationInput) {
    const data = assertValidInput(input);

    const invoice = await prisma.$transaction(async (transaction) => {
        await assertClientAccess(transaction, data.clientId, actor);
        const [company, client] = await Promise.all([
            transaction.company.findUniqueOrThrow({ where: { id: actor.companyId } }),
            transaction.client.findUniqueOrThrow({ where: { id: data.clientId } }),
        ]);
        const year = data.issueDate.getUTCFullYear();
        const sequence = await transaction.invoiceSequence.upsert({
            where: { companyId_year: { companyId: actor.companyId, year } },
            create: { companyId: actor.companyId, year, value: 1 },
            update: { value: { increment: 1 } },
            select: { value: true },
        });

        return transaction.invoice.create({
            data: {
                number: formatInvoiceNumber(year, sequence.value),
                status: data.status as InvoiceStatus,
                issueDate: data.issueDate,
                dueDate: data.dueDate,
                paidAt: data.paidAt,
                notes: data.notes,
                issuerSnapshot: buildIssuerSnapshot(company as InvoiceWithRelations["company"]),
                clientSnapshot: buildClientSnapshot(client as InvoiceWithRelations["client"]),
                subtotalCents: data.subtotalCents,
                vatCents: data.vatCents,
                totalCents: data.totalCents,
                companyId: actor.companyId,
                clientId: data.clientId,
                createdById: actor.id,
                lines: {
                    create: data.lines.map((line, position) => ({ ...line, position })),
                },
            },
            include: invoiceInclude,
        });
    });

    return serializeInvoice(invoice);
}

export async function getById(id: string, actor: InvoiceActor) {
    const invoice = await prisma.invoice.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        include: invoiceInclude,
    });
    if (!invoice) throw new InvoiceDomainError("Facture introuvable.", 404);
    return serializeInvoice(invoice);
}

export async function update(id: string, actor: InvoiceActor, patch: InvoiceMutationInput) {
    const current = await prisma.invoice.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        include: invoiceInclude,
    });
    if (!current) throw new InvoiceDomainError("Facture introuvable.", 404);
    if (current.status !== InvoiceStatus.DRAFT) {
        throw new InvoiceDomainError("Cette facture est validée et ne peut plus être modifiée.", 409);
    }

    const merged = { ...invoiceToInput(current), ...patch, status: "DRAFT" };
    const data = assertValidInput(merged);

    const invoice = await prisma.$transaction(async (transaction) => {
        await assertClientAccess(transaction, data.clientId, actor);
        const [company, client] = await Promise.all([
            transaction.company.findUniqueOrThrow({ where: { id: actor.companyId } }),
            transaction.client.findUniqueOrThrow({ where: { id: data.clientId } }),
        ]);
        await transaction.invoiceLine.deleteMany({ where: { invoiceId: id } });
        return transaction.invoice.update({
            where: { id },
            data: {
                status: data.status as InvoiceStatus,
                issueDate: data.issueDate,
                dueDate: data.dueDate,
                paidAt: data.status === "PAID" ? data.paidAt : null,
                notes: data.notes,
                issuerSnapshot: buildIssuerSnapshot(company as InvoiceWithRelations["company"]),
                clientSnapshot: buildClientSnapshot(client as InvoiceWithRelations["client"]),
                subtotalCents: data.subtotalCents,
                vatCents: data.vatCents,
                totalCents: data.totalCents,
                clientId: data.clientId,
                lines: { create: data.lines.map((line, position) => ({ ...line, position })) },
            },
            include: invoiceInclude,
        });
    });

    return serializeInvoice(invoice);
}

export async function validate(id: string, actor: InvoiceActor) {
    const invoice = await prisma.invoice.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        include: invoiceInclude,
    });
    if (!invoice) throw new InvoiceDomainError("Facture introuvable.", 404);
    if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new InvoiceDomainError("Cette facture est déjà validée.", 409);
    }
    if (!invoice.lines.length) throw new InvoiceDomainError("La facture doit contenir au moins une ligne.", 400);

    return serializeInvoice(
        await prisma.invoice.update({
            where: { id },
            data: { status: InvoiceStatus.SENT },
            include: invoiceInclude,
        }),
    );
}

export async function updateStatus(
    id: string,
    actor: InvoiceActor,
    nextStatus: unknown,
    paidAtValue?: unknown,
) {
    const invoice = await prisma.invoice.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        include: invoiceInclude,
    });
    if (!invoice) throw new InvoiceDomainError("Facture introuvable.", 404);
    if (invoice.status === InvoiceStatus.DRAFT) {
        throw new InvoiceDomainError("Validez d’abord la facture.", 409);
    }
    if (!isInvoiceStatus(nextStatus) || nextStatus === "DRAFT") {
        throw new InvoiceDomainError("Statut invalide.", 400);
    }
    const currentStatus = invoice.status as InvoiceStatusValue;
    if (!isInvoiceStatusTransitionAllowed(currentStatus, nextStatus)) {
        throw new InvoiceDomainError("Transition de statut non autorisée.", 409);
    }

    const paidAt =
        nextStatus === "PAID"
            ? paidAtValue
                ? new Date(String(paidAtValue))
                : new Date()
            : null;
    if (paidAt && Number.isNaN(paidAt.getTime())) {
        throw new InvoiceDomainError("Date de paiement invalide.", 400);
    }

    return serializeInvoice(
        await prisma.invoice.update({
            where: { id },
            data: { status: nextStatus as InvoiceStatus, paidAt },
            include: invoiceInclude,
        }),
    );
}

export async function remove(id: string, actor: InvoiceActor) {
    const invoice = await prisma.invoice.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        select: { id: true, status: true },
    });
    if (!invoice) throw new InvoiceDomainError("Facture introuvable.", 404);
    if (invoice.status !== InvoiceStatus.DRAFT) {
        throw new InvoiceDomainError("Une facture validée ne peut pas être supprimée.", 409);
    }
    await prisma.invoice.delete({ where: { id } });
}
