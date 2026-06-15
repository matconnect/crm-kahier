import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@kahier/db-crm";

const LINK_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LINK_CODE_SEGMENT_LENGTH = 4;
const LINK_CODE_SEGMENTS = 3;
const LINK_CODE_TTL_MS = 15 * 60 * 1000;

export class KahierLinkError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

function hashCode(code: string) {
    return createHash("sha256").update(code).digest("hex");
}

function generateCode() {
    const bytes = randomBytes(LINK_CODE_SEGMENT_LENGTH * LINK_CODE_SEGMENTS);
    let chars = "";
    for (const value of bytes) {
        chars += LINK_CODE_ALPHABET[value % LINK_CODE_ALPHABET.length];
    }

    const segments: string[] = [];
    for (let index = 0; index < LINK_CODE_SEGMENTS; index += 1) {
        const start = index * LINK_CODE_SEGMENT_LENGTH;
        segments.push(chars.slice(start, start + LINK_CODE_SEGMENT_LENGTH));
    }
    return `KAH-${segments.join("-")}`;
}

function formatCodePreview(code: string) {
    const last = code.slice(-LINK_CODE_SEGMENT_LENGTH);
    return `KAH-****-****-${last}`;
}

function mapConnection(connection: Awaited<ReturnType<typeof prisma.kahierConnection.findUnique>>) {
    if (!connection) return null;
    const row = connection as typeof connection & { kahierApiKey?: string | null };
    return {
        id: row.id,
        kahierEstablishmentId: row.kahierEstablishmentId,
        kahierEstablishmentName: row.kahierEstablishmentName,
        kahierZoneId: row.kahierZoneId,
        kahierZoneName: row.kahierZoneName,
        kahierUserId: row.kahierUserId,
        kahierUserLabel: row.kahierUserLabel,
        kahierApiKey: row.kahierApiKey ?? null,
        hasApiKey: Boolean(row.kahierApiKey),
        linkedByUserId: row.linkedByUserId,
        linkedAt: row.linkedAt,
        updatedAt: row.updatedAt,
    };
}

function mapPendingToken(token: Awaited<ReturnType<typeof prisma.kahierLinkToken.findFirst>>) {
    if (!token) return null;
    return {
        id: token.id,
        codePreview: token.codePreview,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
        createdByUserId: token.createdByUserId,
    };
}

export async function getStatus(companyId: string) {
    const now = new Date();
    const [connection, pendingToken] = await Promise.all([
        prisma.kahierConnection.findUnique({ where: { companyId } }),
        prisma.kahierLinkToken.findFirst({
            where: {
                companyId,
                consumedAt: null,
                expiresAt: { gt: now },
            },
            orderBy: { createdAt: "desc" },
        }),
    ]);

    return {
        connection: mapConnection(connection),
        pendingLink: mapPendingToken(pendingToken),
    };
}

export async function createLinkCode(params: { companyId: string; createdByUserId: string }) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LINK_CODE_TTL_MS);

    await prisma.kahierLinkToken.updateMany({
        where: {
            companyId: params.companyId,
            consumedAt: null,
            expiresAt: { gt: now },
        },
        data: {
            consumedAt: now,
        },
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const code = generateCode();
        try {
            const token = await prisma.kahierLinkToken.create({
                data: {
                    companyId: params.companyId,
                    codeHash: hashCode(code),
                    codePreview: formatCodePreview(code),
                    expiresAt,
                    createdByUserId: params.createdByUserId,
                },
            });

            return {
                code,
                expiresAt: token.expiresAt,
                pendingLink: mapPendingToken(token),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : "";
            if (!message.includes("Unique constraint")) throw error;
        }
    }

    throw new Error("Failed to generate a unique Kahier link code");
}

export async function confirmLinkCode(params: {
    code: string;
    kahierEstablishmentId: number;
    kahierEstablishmentName: string;
    kahierZoneId: number | null;
    kahierZoneName: string | null;
    kahierUserId: number | null;
    kahierUserLabel: string | null;
}) {
    const now = new Date();
    const token = await prisma.kahierLinkToken.findUnique({
        where: { codeHash: hashCode(params.code.trim().toUpperCase()) },
    });

    if (!token) {
        throw new KahierLinkError("Code de liaison invalide.", 404);
    }
    if (token.consumedAt) {
        throw new KahierLinkError("Ce code de liaison a déjà été utilisé.", 409);
    }
    if (token.expiresAt.getTime() <= now.getTime()) {
        throw new KahierLinkError("Ce code de liaison a expiré.", 410);
    }

    const connection = await prisma.$transaction(async (tx) => {
        await tx.kahierLinkToken.update({
            where: { id: token.id },
            data: {
                consumedAt: now,
                kahierEstablishmentId: params.kahierEstablishmentId,
                kahierEstablishmentName: params.kahierEstablishmentName,
                kahierZoneId: params.kahierZoneId,
                kahierZoneName: params.kahierZoneName,
                kahierUserId: params.kahierUserId,
                kahierUserLabel: params.kahierUserLabel,
            },
        });

        return tx.kahierConnection.upsert({
            where: { companyId: token.companyId },
            create: {
                companyId: token.companyId,
                kahierEstablishmentId: params.kahierEstablishmentId,
                kahierEstablishmentName: params.kahierEstablishmentName,
                kahierZoneId: params.kahierZoneId,
                kahierZoneName: params.kahierZoneName,
                kahierUserId: params.kahierUserId,
                kahierUserLabel: params.kahierUserLabel,
                linkedByUserId: token.createdByUserId,
                linkedAt: now,
            },
            update: {
                kahierEstablishmentId: params.kahierEstablishmentId,
                kahierEstablishmentName: params.kahierEstablishmentName,
                kahierZoneId: params.kahierZoneId,
                kahierZoneName: params.kahierZoneName,
                kahierUserId: params.kahierUserId,
                kahierUserLabel: params.kahierUserLabel,
                linkedByUserId: token.createdByUserId,
                linkedAt: now,
            },
        });
    });

    return {
        ok: true,
        connection: mapConnection(connection),
    };
}

export async function saveApiKey(params: { companyId: string; apiKey: string }) {
    const updated = await prisma.kahierConnection.upsert({
        where: { companyId: params.companyId },
        create: {
            companyId: params.companyId,
            kahierEstablishmentId: 0,
            kahierEstablishmentName: "Non renseigné",
            kahierApiKey: params.apiKey,
            linkedAt: new Date(),
        },
        update: { kahierApiKey: params.apiKey } as any,
    });

    return {
        ok: true,
        connection: mapConnection(updated),
    };
}

export async function deleteApiKey(params: { companyId: string }) {
    const existing = await prisma.kahierConnection.findUnique({
        where: { companyId: params.companyId },
    });

    if (!existing) {
        return { ok: true, connection: null };
    }

    const updated = await prisma.kahierConnection.update({
        where: { companyId: params.companyId },
        data: { kahierApiKey: null } as any,
    });

    return {
        ok: true,
        connection: mapConnection(updated),
    };
}
