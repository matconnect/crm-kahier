import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "@kahier/db";
import { Role } from "@prisma/client";

const router: ExpressRouter = Router();

router.use(async (req, res, next) => {
    const userId = (req.headers["x-user-id"] as string | undefined)?.trim();
    if (!userId) return res.status(401).json({ error: "x-user-id requis" });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.companyId) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    (req as unknown as { currentUser: typeof user }).currentUser = user;
    next();
});

router.get("/", async (req, res) => {
    const currentUser = (req as unknown as { currentUser: { companyId: string; role: Role } }).currentUser;
    if (currentUser.role === "USER") return res.status(403).json({ error: "Accès refusé" });

    const company = await prisma.company.findUnique({
        where: { id: currentUser.companyId },
        select: {
            id: true,
            name: true,
            code: true,
            createdAt: true,
            users: {
                select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });
    if (!company) return res.status(404).json({ error: "Entreprise introuvable" });

    return res.json({ company, viewerRole: currentUser.role, creatorId: company.users[0]?.id ?? null });
});

router.patch("/", async (req, res) => {
    const currentUser = (req as unknown as { currentUser: { companyId: string; role: Role; id: string } }).currentUser;
    if (currentUser.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

    const { userId, role } = req.body ?? {};
    if (!userId || !role || !Object.values(Role).includes(role)) {
        return res.status(400).json({ error: "Paramètres invalides" });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target || target.companyId !== currentUser.companyId) {
        return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    // Le créateur (premier user) ne peut pas être modifié
    const firstUser = await prisma.user.findFirst({
        where: { companyId: currentUser.companyId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
    });
    if (firstUser && firstUser.id === target.id) {
        return res.status(403).json({ error: "Impossible de modifier le créateur de l'entreprise" });
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    return res.json({ user: updated });
});

export default router;
