import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "@kahier/db-company";

const router: ExpressRouter = Router();

router.use(async (req, res, next) => {
    const userId = (req.headers["x-user-id"] as string | undefined)?.trim();
    if (!userId) return res.status(401).json({ error: "x-user-id requis" });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!user?.companyId) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    (req as unknown as { companyId: string }).companyId = user.companyId;
    next();
});

router.get("/", async (req, res) => {
    const companyId = (req as unknown as { companyId: string }).companyId;
    const users = await prisma.user.findMany({
        where: { companyId },
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    res.json({
        users: users.map((user) => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            label: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email,
        })),
    });
});

export default router;
