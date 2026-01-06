import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@kahier/db";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    if (!session.user.companyId) {
        return NextResponse.json({ error: "Aucune entreprise associée." }, { status: 401 });
    }

    const users = await prisma.user.findMany({
        where: { companyId: session.user.companyId },
        select: { id: true, email: true, firstName: true, lastName: true },
        orderBy: { createdAt: "asc" },
    });

    const formatted = users.map((u) => ({
        id: u.id,
        email: u.email,
        label: formatName(u.firstName, u.lastName, u.email),
    }));

    return NextResponse.json({ users: formatted });
}

function formatName(firstName?: string | null, lastName?: string | null, fallback?: string | null) {
    const full = `${firstName ?? ""} ${lastName ?? ""}`.trim();
    return full || fallback || "Utilisateur";
}
