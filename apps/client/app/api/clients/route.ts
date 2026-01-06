import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@kahier/db";
import { ClientSegment, ClientStatus, type Prisma } from "@prisma/client";

type CreateClientPayload = {
    name?: string;
    ownerId?: string | null;
    status?: string;
    segment?: string;
    location?: string | null;
    primaryEmail?: string | null;
    primaryPhone?: string | null;
    notes?: string | null;
    contact?: ContactInput; // kept for backward compatibility
    contacts?: ContactInput[];
};

type ContactInput = {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    role?: string | null;
};

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    if (!session.user.companyId) {
        return NextResponse.json({ error: "Aucune entreprise associée." }, { status: 401 });
    }

    const body = (await req.json()) as CreateClientPayload;
    const name = body.name?.trim();

    if (!name) {
        return NextResponse.json({ error: "Le nom du client est requis." }, { status: 400 });
    }

    try {
        const status = parseEnum(body.status, ClientStatus) ?? ClientStatus.PROSPECT;
        const segment = parseEnum(body.segment, ClientSegment) ?? ClientSegment.OTHER;
        const ownerId = clean(body.ownerId) ?? session.user.id;

        const ownerExists = await prisma.user.findFirst({ where: { id: ownerId, companyId: session.user.companyId } });
        if (!ownerExists) {
            return NextResponse.json({ error: "Responsable introuvable." }, { status: 400 });
        }

        const payload: Prisma.ClientCreateArgs["data"] = {
            name,
            status,
            segment,
            location: clean(body.location),
            primaryEmail: clean(body.primaryEmail)?.toLowerCase(),
            primaryPhone: clean(body.primaryPhone),
            notes: clean(body.notes),
            ownerId,
            companyId: session.user.companyId,
        };

        const contacts = buildContacts(body.contacts ?? (body.contact ? [body.contact] : undefined));
        if (contacts.length) {
            payload.contacts = { create: contacts };
        }

        const client = await prisma.client.create({
            data: payload,
            include: { contacts: true, owner: true, interactions: true },
        });

        return NextResponse.json({ client }, { status: 201 });
    } catch (error) {
        console.error("Client creation failed", error);
        return NextResponse.json({ error: "Impossible de créer le client pour le moment." }, { status: 500 });
    }
}

export async function GET() {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
        where: { companyId: session.user.companyId },
        orderBy: { createdAt: "desc" },
        include: {
            owner: { select: { firstName: true, lastName: true, email: true } },
            _count: { select: { contacts: true } },
            interactions: { select: { occurredAt: true }, orderBy: { occurredAt: "desc" }, take: 1 },
        },
        take: 50,
    });

    return NextResponse.json({
        items: clients.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            segment: c.segment,
            location: c.location,
            contactsCount: c._count.contacts,
            owner:
                c.owner && (c.owner.firstName || c.owner.lastName)
                    ? `${c.owner.firstName ?? ""} ${c.owner.lastName ?? ""}`.trim()
                    : c.owner?.email ?? null,
            lastActivity: c.interactions[0]?.occurredAt ?? null,
        })),
        total: clients.length,
    });
}

function clean(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

function parseEnum<T extends Record<string, string>>(value: unknown, enumObject: T) {
    return typeof value === "string" && Object.values(enumObject).includes(value as T[keyof T])
        ? (value as T[keyof T])
        : undefined;
}

function buildContacts(raw?: ContactInput[]) {
    if (!raw?.length) return [];
    return raw
        .map((item): Prisma.ClientContactCreateWithoutClientInput | null => {
            const firstName = clean(item.firstName);
            const lastName = clean(item.lastName);
            const email = clean(item.email)?.toLowerCase();
            const phone = clean(item.phone);
            const role = clean(item.role);

            if (!firstName && !lastName && !email && !phone && !role) return null;

            return {
                firstName: firstName ?? "Contact",
                lastName: lastName ?? "",
                email,
                phone,
                role,
            };
        })
        .filter(Boolean) as Prisma.ClientContactCreateWithoutClientInput[];
}
