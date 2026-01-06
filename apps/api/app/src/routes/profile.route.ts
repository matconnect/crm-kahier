import { Router, type Router as ExpressRouter } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "@kahier/db";

const router: ExpressRouter = Router();

router.use((req, res, next) => {
    const userId = (req.headers["x-user-id"] as string | undefined)?.trim();
    if (!userId) return res.status(401).json({ error: "x-user-id requis" });
    (req as unknown as { userId: string }).userId = userId;
    next();
});

router.get("/", async (req, res) => {
    const userId = (req as unknown as { userId: string }).userId;
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json({ user });
});

router.patch("/", async (req, res) => {
    const userId = (req as unknown as { userId: string }).userId;
    const { firstName, lastName, password, email } = req.body ?? {};

    const data: { firstName?: string | null; lastName?: string | null; password?: string; email?: string } = {};
    if (typeof firstName === "string") data.firstName = firstName.trim();
    if (typeof lastName === "string") data.lastName = lastName.trim();
    if (typeof email === "string") {
        const cleaned = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleaned)) return res.status(400).json({ error: "Email invalide" });
        const exists = await prisma.user.findUnique({ where: { email: cleaned } });
        if (exists && exists.id !== userId) return res.status(409).json({ error: "Email déjà utilisé" });
        data.email = cleaned;
    }
    if (typeof password === "string" && password.length > 0) {
        if (password.length < 8) return res.status(400).json({ error: "Mot de passe trop court (8 caractères min.)" });
        data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
        where: { id: userId },
        data,
        select: { id: true, email: true, firstName: true, lastName: true },
    });
    res.json({ user });
});

export default router;
