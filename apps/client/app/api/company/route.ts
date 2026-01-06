import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@kahier/db";
import { Role } from "@prisma/client";

export async function GET() {
    const session = await auth();
    if (!session?.user?.companyId) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    if (session.user.role === "USER") {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const company = await prisma.company.findUnique({
        where: { id: session.user.companyId },
        select: {
            id: true,
            name: true,
            code: true,
            createdAt: true,
            users: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "asc" },
            },
        },
    });

    if (!company) {
        return NextResponse.json({ error: "Entreprise introuvable." }, { status: 404 });
    }

    const creatorId = company.users[0]?.id ?? null; // users are ordered by createdAt asc

    return NextResponse.json({ company, viewerRole: session.user.role, creatorId });
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.companyId || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const body = (await req.json()) as { userId?: string; role?: string };
    const userId = body.userId?.trim();
    const role = body.role as Role | undefined;

    if (!userId || !role || !Object.values(Role).includes(role)) {
        return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.companyId !== session.user.companyId) {
        return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true },
    });

    return NextResponse.json({ user: updated });
}
