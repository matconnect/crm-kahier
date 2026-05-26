import { Router, type Router as ExpressRouter } from "express";
import { prisma } from "@kahier/db-company";
import { readFileSync } from "node:fs";

const router: ExpressRouter = Router();

function fromEnvOrFile(name: string): string | undefined {
    const direct = process.env[name];
    if (direct && direct.trim()) return direct.trim();

    const filePath = process.env[`${name}_FILE`];
    if (filePath && filePath.trim()) {
        return readFileSync(filePath.trim(), "utf8").trim();
    }

    return undefined;
}

function isAuthorized(reqToken: string | undefined): boolean {
    const internalToken = fromEnvOrFile("INTERNAL_SERVICE_TOKEN");
    return Boolean(internalToken) && reqToken === internalToken;
}

router.use((req, res, next) => {
    const token = (req.headers["x-internal-token"] as string | undefined)?.trim();
    if (!isAuthorized(token)) {
        return res.status(401).json({ error: "Unauthorized internal access" });
    }
    next();
});

router.get("/context/:userId", async (req, res) => {
    const userId = req.params.userId?.trim();
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            companyId: true,
            company: { select: { id: true, name: true, code: true, subscriptionType: true } },
        },
    });

    if (!user?.companyId || !user.company) {
        return res.status(404).json({ error: "User or company not found" });
    }

    return res.json({
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            companyId: user.companyId,
        },
        company: user.company,
    });
});

router.get("/company/:companyId/users", async (req, res) => {
    const companyId = req.params.companyId?.trim();
    if (!companyId) {
        return res.status(400).json({ error: "companyId is required" });
    }

    const users = await prisma.user.findMany({
        where: { companyId },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            companyId: true,
        },
    });

    return res.json({ users });
});

export default router;
