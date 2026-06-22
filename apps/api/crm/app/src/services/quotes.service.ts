import { QuoteStatus, prisma, type Prisma } from "@kahier/db-crm";
import {
    formatQuoteNumber,
    getEffectiveQuoteStatus,
    isQuoteStatus,
    isQuoteStatusTransitionAllowed,
    validateQuoteInput,
    type QuoteStatusValue,
} from "./quotes.domain.js";
import type { QuoteActor, QuoteListParams, QuoteMutationInput, QuoteWithRelations, SerializedQuote } from "./quotes.types.js";

const quoteInclude = {
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
} satisfies Prisma.QuoteInclude;

export class QuoteDomainError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly details?: unknown,
    ) {
        super(message);
    }
}

function accessWhere(actor: QuoteActor): Prisma.QuoteWhereInput {
    const base: Prisma.QuoteWhereInput = { companyId: actor.companyId };
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

function clientAccessWhere(actor: QuoteActor): Prisma.ClientWhereInput {
    return {
        companyId: actor.companyId,
        ...(actor.role === "USER"
            ? { OR: [{ ownerId: actor.id }, { owners: { some: { userId: actor.id } } }] }
            : {}),
    };
}

function assertValidInput(input: QuoteMutationInput) {
    const result = validateQuoteInput(input);
    if (!result.ok) throw new QuoteDomainError("Données de devis invalides.", 400, result.errors);
    return result.data;
}

function quoteToInput(quote: QuoteWithRelations): QuoteMutationInput {
    return {
        clientId: quote.clientId,
        status: quote.status,
        issueDate: quote.issueDate,
        expiryDate: quote.expiryDate,
        acceptedAt: quote.acceptedAt,
        notes: quote.notes,
        lines: quote.lines.map((line) => ({
            description: line.description,
            quantity: line.quantityMilli / 1_000,
            unitPrice: line.unitPriceCents / 100,
            vatRate: line.vatRateBps / 100,
        })),
    };
}

function buildIssuerSnapshot(company: QuoteWithRelations["company"]) {
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

function buildClientSnapshot(client: QuoteWithRelations["client"]) {
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

export function serializeQuote(quote: QuoteWithRelations, now = new Date()): SerializedQuote {
    const storedStatus = quote.status as QuoteStatusValue;
    return {
        ...quote,
        storedStatus,
        status: getEffectiveQuoteStatus(storedStatus, quote.expiryDate, now),
        lines: quote.lines.map((line) => ({
            ...line,
            quantity: line.quantityMilli / 1_000,
            unitPrice: line.unitPriceCents / 100,
            vatRate: line.vatRateBps / 100,
        })),
    };
}

async function assertClientAccess(database: Prisma.TransactionClient | typeof prisma, clientId: string, actor: QuoteActor) {
    const client = await database.client.findFirst({
        where: { ...clientAccessWhere(actor), id: clientId },
        select: { id: true },
    });
    if (!client) throw new QuoteDomainError("Client introuvable ou inaccessible.", 400);
}

export async function list(actor: QuoteActor, params: QuoteListParams) {
    const page = Number.isFinite(params.page) ? Math.max(1, Math.floor(params.page)) : 1;
    const pageSize = Number.isFinite(params.pageSize) ? Math.min(100, Math.max(1, Math.floor(params.pageSize))) : 20;
    const now = new Date();
    const status = isQuoteStatus(params.status) ? params.status : undefined;
    const statusFilter: Prisma.QuoteWhereInput | undefined =
        status === "EXPIRED"
            ? { OR: [{ status: QuoteStatus.EXPIRED }, { status: QuoteStatus.SENT, expiryDate: { lt: now } }] }
            : status === "SENT"
              ? { status: QuoteStatus.SENT, expiryDate: { gte: now } }
              : status
                ? { status: status as QuoteStatus }
                : undefined;

    const q = params.q?.trim() ?? "";
    const where: Prisma.QuoteWhereInput = {
        AND: [
            accessWhere(actor),
            ...(statusFilter ? [statusFilter] : []),
            ...(params.clientId ? [{ clientId: params.clientId }] : []),
            ...(q
                ? [
                      {
                          OR: [{ number: { contains: q } }, { client: { is: { name: { contains: q } } } }],
                      },
                  ]
                : []),
        ],
    };

    const [items, total] = await Promise.all([
        prisma.quote.findMany({
            where,
            include: quoteInclude,
            orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
            skip: (page - 1) * pageSize,
            take: pageSize,
        }),
        prisma.quote.count({ where }),
    ]);

    return { items: items.map((quote) => serializeQuote(quote, now)), total, page, pageSize };
}

export async function summary(actor: QuoteActor) {
    const now = new Date();
    const base = accessWhere(actor);
    const activeAmountsWhere: Prisma.QuoteWhereInput = {
        AND: [base, { status: { notIn: [QuoteStatus.CANCELLED, QuoteStatus.REJECTED] } }],
    };
    const pendingAmountsWhere: Prisma.QuoteWhereInput = {
        AND: [
            base,
            {
                OR: [
                    { status: QuoteStatus.SENT, expiryDate: { gte: now } },
                    { status: QuoteStatus.EXPIRED },
                    { status: QuoteStatus.SENT, expiryDate: { lt: now } },
                ],
            },
        ],
    };

    const [total, draft, sent, accepted, rejected, expired, cancelled, amounts, acceptedAmounts, pendingAmounts] = await Promise.all([
        prisma.quote.count({ where: base }),
        prisma.quote.count({ where: { AND: [base, { status: QuoteStatus.DRAFT }] } }),
        prisma.quote.count({ where: { AND: [base, { status: QuoteStatus.SENT, expiryDate: { gte: now } }] } }),
        prisma.quote.count({ where: { AND: [base, { status: QuoteStatus.ACCEPTED }] } }),
        prisma.quote.count({ where: { AND: [base, { status: QuoteStatus.REJECTED }] } }),
        prisma.quote.count({
            where: {
                AND: [base, { OR: [{ status: QuoteStatus.EXPIRED }, { status: QuoteStatus.SENT, expiryDate: { lt: now } }] }],
            },
        }),
        prisma.quote.count({ where: { AND: [base, { status: QuoteStatus.CANCELLED }] } }),
        prisma.quote.aggregate({ where: activeAmountsWhere, _sum: { subtotalCents: true, vatCents: true, totalCents: true } }),
        prisma.quote.aggregate({
            where: { AND: [base, { status: QuoteStatus.ACCEPTED }] },
            _sum: { totalCents: true },
        }),
        prisma.quote.aggregate({
            where: pendingAmountsWhere,
            _sum: { totalCents: true },
        }),
    ]);

    const acceptedCents = acceptedAmounts._sum.totalCents ?? 0;
    const totalCents = amounts._sum.totalCents ?? 0;
    return {
        total,
        draft,
        sent,
        accepted,
        rejected,
        expired,
        cancelled,
        subtotalCents: amounts._sum.subtotalCents ?? 0,
        vatCents: amounts._sum.vatCents ?? 0,
        totalCents,
        acceptedCents,
        pendingCents: pendingAmounts._sum.totalCents ?? 0,
    };
}

export async function create(actor: QuoteActor, input: QuoteMutationInput) {
    const data = assertValidInput(input);

    const quote = await prisma.$transaction(async (transaction) => {
        await assertClientAccess(transaction, data.clientId, actor);
        const [company, client] = await Promise.all([
            transaction.company.findUniqueOrThrow({ where: { id: actor.companyId } }),
            transaction.client.findUniqueOrThrow({ where: { id: data.clientId } }),
        ]);
        const year = data.issueDate.getUTCFullYear();
        const sequence = await transaction.quoteSequence.upsert({
            where: { companyId_year: { companyId: actor.companyId, year } },
            create: { companyId: actor.companyId, year, value: 1 },
            update: { value: { increment: 1 } },
            select: { value: true },
        });

        return transaction.quote.create({
            data: {
                number: formatQuoteNumber(year, sequence.value),
                status: data.status as QuoteStatus,
                issueDate: data.issueDate,
                expiryDate: data.expiryDate,
                acceptedAt: data.acceptedAt,
                notes: data.notes,
                issuerSnapshot: buildIssuerSnapshot(company as QuoteWithRelations["company"]),
                clientSnapshot: buildClientSnapshot(client as QuoteWithRelations["client"]),
                subtotalCents: data.subtotalCents,
                vatCents: data.vatCents,
                totalCents: data.totalCents,
                companyId: actor.companyId,
                clientId: data.clientId,
                createdById: actor.id,
                lines: { create: data.lines.map((line, position) => ({ ...line, position })) },
            },
            include: quoteInclude,
        });
    });

    return serializeQuote(quote);
}

export async function getById(id: string, actor: QuoteActor) {
    const quote = await prisma.quote.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        include: quoteInclude,
    });
    if (!quote) throw new QuoteDomainError("Devis introuvable.", 404);
    return serializeQuote(quote);
}

export async function update(id: string, actor: QuoteActor, patch: QuoteMutationInput) {
    const current = await prisma.quote.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        include: quoteInclude,
    });
    if (!current) throw new QuoteDomainError("Devis introuvable.", 404);
    if (current.status !== QuoteStatus.DRAFT) {
        throw new QuoteDomainError("Ce devis est validé et ne peut plus être modifié.", 409);
    }

    const merged = { ...quoteToInput(current), ...patch, status: "DRAFT" };
    const data = assertValidInput(merged);

    const quote = await prisma.$transaction(async (transaction) => {
        await assertClientAccess(transaction, data.clientId, actor);
        const [company, client] = await Promise.all([
            transaction.company.findUniqueOrThrow({ where: { id: actor.companyId } }),
            transaction.client.findUniqueOrThrow({ where: { id: data.clientId } }),
        ]);
        await transaction.quoteLine.deleteMany({ where: { quoteId: id } });
        return transaction.quote.update({
            where: { id },
            data: {
                status: data.status as QuoteStatus,
                issueDate: data.issueDate,
                expiryDate: data.expiryDate,
                acceptedAt: data.status === "ACCEPTED" ? data.acceptedAt : null,
                notes: data.notes,
                issuerSnapshot: buildIssuerSnapshot(company as QuoteWithRelations["company"]),
                clientSnapshot: buildClientSnapshot(client as QuoteWithRelations["client"]),
                subtotalCents: data.subtotalCents,
                vatCents: data.vatCents,
                totalCents: data.totalCents,
                clientId: data.clientId,
                lines: { create: data.lines.map((line, position) => ({ ...line, position })) },
            },
            include: quoteInclude,
        });
    });

    return serializeQuote(quote);
}

export async function validate(id: string, actor: QuoteActor) {
    const quote = await prisma.quote.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        include: quoteInclude,
    });
    if (!quote) throw new QuoteDomainError("Devis introuvable.", 404);
    if (quote.status !== QuoteStatus.DRAFT) {
        throw new QuoteDomainError("Ce devis est déjà validé.", 409);
    }
    if (!quote.lines.length) throw new QuoteDomainError("Le devis doit contenir au moins une ligne.", 400);

    return serializeQuote(
        await prisma.quote.update({
            where: { id },
            data: { status: QuoteStatus.SENT },
            include: quoteInclude,
        }),
    );
}

export async function updateStatus(id: string, actor: QuoteActor, nextStatus: unknown, acceptedAtValue?: unknown) {
    const quote = await prisma.quote.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        include: quoteInclude,
    });
    if (!quote) throw new QuoteDomainError("Devis introuvable.", 404);
    if (quote.status === QuoteStatus.DRAFT) {
        throw new QuoteDomainError("Validez d’abord le devis.", 409);
    }
    if (!isQuoteStatus(nextStatus) || nextStatus === "DRAFT") {
        throw new QuoteDomainError("Statut invalide.", 400);
    }
    const currentStatus = quote.status as QuoteStatusValue;
    if (!isQuoteStatusTransitionAllowed(currentStatus, nextStatus)) {
        throw new QuoteDomainError("Transition de statut non autorisée.", 409);
    }

    const acceptedAt =
        nextStatus === "ACCEPTED"
            ? acceptedAtValue
                ? new Date(String(acceptedAtValue))
                : new Date()
            : null;
    if (acceptedAt && Number.isNaN(acceptedAt.getTime())) {
        throw new QuoteDomainError("Date d’acceptation invalide.", 400);
    }

    return serializeQuote(
        await prisma.quote.update({
            where: { id },
            data: { status: nextStatus as QuoteStatus, acceptedAt },
            include: quoteInclude,
        }),
    );
}

export async function remove(id: string, actor: QuoteActor) {
    const quote = await prisma.quote.findFirst({
        where: { AND: [{ id }, accessWhere(actor)] },
        select: { id: true, status: true },
    });
    if (!quote) throw new QuoteDomainError("Devis introuvable.", 404);
    if (quote.status !== QuoteStatus.DRAFT) {
        throw new QuoteDomainError("Seuls les brouillons peuvent être supprimés.", 409);
    }
    await prisma.quote.delete({ where: { id } });
}
