import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@kahier/db";

export async function POST(req: Request) {
    const body = (await req.json()) as { email?: string; password?: string; name?: string };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim() || null;

    if (!email || !password) {
        return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }
    if (password.length < 8) {
        return NextResponse.json({ error: "Mot de passe trop court (8 minimum)." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        return NextResponse.json({ error: "Email déjà utilisé." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { email, password: hash, name, role: "USER" },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return NextResponse.json({ user }, { status: 201 });
}
