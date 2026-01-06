import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@kahier/db";
import { slugify } from "@/lib/slugify";

function generateCompanyCode() {
    return `cmp_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(req: Request) {
    const body = (await req.json()) as {
        email?: string;
        password?: string;
        firstName?: string;
        lastName?: string;
        companyId?: string;
        companyName?: string;
        companyCode?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const firstName = body.firstName?.trim() || null;
    const lastName = body.lastName?.trim() || null;
    if (!email || !password || !firstName || !lastName) {
        return NextResponse.json({ error: "Email, prénom, nom et mot de passe requis." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Email invalide. Essayez une autre adresse (exemple@gmail.com)." }, { status: 400 });
    }

    if (password.length < 8) {
        return NextResponse.json({ error: "Mot de passe trop court (8 minimum)." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        return NextResponse.json({ error: "Email déjà utilisé." }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    let companyId = body.companyId?.trim() || null;
    let role: "USER" | "ADMIN" = "USER";
    if (body.companyCode?.trim()) {
        const existingByCode = await prisma.company.findUnique({ where: { code: body.companyCode.trim() } });
        if (!existingByCode) {
            return NextResponse.json({ error: "Code entreprise invalide." }, { status: 400 });
        }
        companyId = existingByCode.id;
    }

    let company;
    if (!companyId) {
        const name = body.companyName?.trim() || email.split("@")[1]?.split(".")[0] || "Entreprise";
        const slug = slugify(name);
        company = await prisma.company.create({
            data: { name, id: `cmp_${slug}_${Date.now()}`, code: generateCompanyCode() },
        });
        companyId = company.id;
        role = "ADMIN";
    } else {
        company = await prisma.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return NextResponse.json({ error: "Entreprise introuvable." }, { status: 400 });
        }
    }

    const user = await prisma.user.create({
        data: { email, password: hash, firstName, lastName, role, companyId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true, createdAt: true },
    });

    return NextResponse.json(
        {
            user,
            company: company ? { id: company.id, name: company.name, code: company.code } : null,
        },
        { status: 201 },
    );
}
