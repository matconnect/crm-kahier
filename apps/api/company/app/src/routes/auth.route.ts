import { Router, type Router as ExpressRouter } from "express";
import bcrypt from "bcryptjs";
import { prisma, type Role } from "@kahier/db-company";

const router: ExpressRouter = Router();

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

function generateCompanyCode() {
    return `cmp_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

router.post("/login", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : null;
    const password = typeof req.body?.password === "string" ? req.body.password : null;

    if (!email || !password) {
        return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Identifiants invalides." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Identifiants invalides." });

    return res.json({
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as Role,
            companyId: user.companyId ?? null,
        },
    });
});

router.post("/register", async (req, res) => {
    const body = req.body as {
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
        return res.status(400).json({ error: "Email, prénom, nom et mot de passe requis." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email invalide. Essayez une autre adresse (exemple@gmail.com)." });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Mot de passe trop court (8 minimum)." });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        return res.status(409).json({ error: "Email déjà utilisé." });
    }

    const hash = await bcrypt.hash(password, 10);

    let companyId = body.companyId?.trim() || null;
    let role: "USER" | "ADMIN" = "USER";
    if (body.companyCode?.trim()) {
        const existingByCode = await prisma.company.findUnique({ where: { code: body.companyCode.trim() } });
        if (!existingByCode) {
            return res.status(400).json({ error: "Code entreprise invalide." });
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
            return res.status(400).json({ error: "Entreprise introuvable." });
        }
    }

    const user = await prisma.user.create({
        data: { email, password: hash, firstName, lastName, role, companyId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, companyId: true, createdAt: true },
    });

    return res.status(201).json({
        user,
        company: company ? { id: company.id, name: company.name, code: company.code } : null,
    });
});

export default router;
