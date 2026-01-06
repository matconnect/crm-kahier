import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@kahier/db";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });

    return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = (await req.json()) as { firstName?: string; lastName?: string; password?: string };
    const data: { firstName?: string | null; lastName?: string | null; password?: string } = {};

    if (typeof body.firstName === "string") data.firstName = body.firstName.trim();
    if (typeof body.lastName === "string") data.lastName = body.lastName.trim();

    if (body.password) {
        if (body.password.length < 8) {
            return NextResponse.json({ error: "Mot de passe trop court (8 caractères min)." }, { status: 400 });
        }
        data.password = await bcrypt.hash(body.password, 10);
    }

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data,
        select: { id: true, email: true, firstName: true, lastName: true },
    });

    return NextResponse.json({ user });
}
