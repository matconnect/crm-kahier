import { Router, type Router as ExpressRouter } from "express";
import { prisma, Role } from "@kahier/db-company";

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
            legalForm: true,
            capitalSocialCents: true,
            siren: true,
            siret: true,
            vatNumber: true,
            rcsCity: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            city: true,
            country: true,
            contactEmail: true,
            contactPhone: true,
            paymentTerms: true,
            latePenaltyRateBps: true,
            fixedCompensationCents: true,
            createdAt: true,
            subscriptionType: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            stripePriceId: true,
            stripeSubscriptionStatus: true,
            stripePurchasedAt: true,
            stripeCurrentPeriodStart: true,
            stripeCurrentPeriodEnd: true,
            users: {
                select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
                orderBy: { createdAt: "asc" },
            },
        },
    });
    if (!company) return res.status(404).json({ error: "Entreprise introuvable" });

    const stripe =
        currentUser.role === "ADMIN"
            ? {
                subscriptionType: company.subscriptionType,
                stripeCustomerId: company.stripeCustomerId,
                stripeSubscriptionId: company.stripeSubscriptionId,
                stripePriceId: company.stripePriceId,
                stripeSubscriptionStatus: company.stripeSubscriptionStatus,
                stripePurchasedAt: company.stripePurchasedAt,
                stripeCurrentPeriodStart: company.stripeCurrentPeriodStart,
                stripeCurrentPeriodEnd: company.stripeCurrentPeriodEnd,
            }
            : null;

    return res.json({
        company: {
            id: company.id,
            name: company.name,
            code: company.code,
            legalForm: company.legalForm,
            capitalSocialCents: company.capitalSocialCents,
            siren: company.siren,
            siret: company.siret,
            vatNumber: company.vatNumber,
            rcsCity: company.rcsCity,
            addressLine1: company.addressLine1,
            addressLine2: company.addressLine2,
            postalCode: company.postalCode,
            city: company.city,
            country: company.country,
            contactEmail: company.contactEmail,
            contactPhone: company.contactPhone,
            paymentTerms: company.paymentTerms,
            latePenaltyRateBps: company.latePenaltyRateBps,
            fixedCompensationCents: company.fixedCompensationCents,
            createdAt: company.createdAt,
            users: company.users,
        },
        stripe,
        viewerRole: currentUser.role,
        creatorId: company.users[0]?.id ?? null,
    });
});

router.patch("/", async (req, res) => {
    const currentUser = (req as unknown as { currentUser: { companyId: string; role: Role; id: string } }).currentUser;
    if (currentUser.role !== "ADMIN") return res.status(403).json({ error: "Accès refusé" });

    const body = req.body ?? {};

    if (body.userId && body.role) {
        const { userId, role } = body;
        if (!userId || !role || !Object.values(Role).includes(role)) {
            return res.status(400).json({ error: "Paramètres invalides" });
        }

        const target = await prisma.user.findUnique({ where: { id: userId } });
        if (!target || target.companyId !== currentUser.companyId) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

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
    }

    const trim = (value: unknown) => (typeof value === "string" ? value.trim() || null : undefined);
    const toIntOrNull = (value: unknown) => {
        if (value === null || value === "") return null;
        if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
        if (typeof value === "string" && /^-?\d+$/.test(value.trim())) return Number.parseInt(value.trim(), 10);
        return undefined;
    };

    const capitalSocialCents = toIntOrNull(body.capitalSocialCents);
    const latePenaltyRateBps = toIntOrNull(body.latePenaltyRateBps);
    const fixedCompensationCents = toIntOrNull(body.fixedCompensationCents);

    if ([capitalSocialCents, latePenaltyRateBps, fixedCompensationCents].includes(undefined)) {
        return res.status(400).json({ error: "Valeurs numériques invalides" });
    }

    const company = await prisma.company.update({
        where: { id: currentUser.companyId },
        data: {
            name: trim(body.name) ?? undefined,
            legalForm: trim(body.legalForm) ?? undefined,
            capitalSocialCents: capitalSocialCents ?? undefined,
            siren: trim(body.siren) ?? undefined,
            siret: trim(body.siret) ?? undefined,
            vatNumber: trim(body.vatNumber) ?? undefined,
            rcsCity: trim(body.rcsCity) ?? undefined,
            addressLine1: trim(body.addressLine1) ?? undefined,
            addressLine2: trim(body.addressLine2) ?? undefined,
            postalCode: trim(body.postalCode) ?? undefined,
            city: trim(body.city) ?? undefined,
            country: trim(body.country) ?? undefined,
            contactEmail: trim(body.contactEmail) ?? undefined,
            contactPhone: trim(body.contactPhone) ?? undefined,
            paymentTerms: trim(body.paymentTerms) ?? undefined,
            latePenaltyRateBps: latePenaltyRateBps ?? undefined,
            fixedCompensationCents: fixedCompensationCents ?? undefined,
        },
        select: {
            id: true,
            name: true,
            legalForm: true,
            capitalSocialCents: true,
            siren: true,
            siret: true,
            vatNumber: true,
            rcsCity: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            city: true,
            country: true,
            contactEmail: true,
            contactPhone: true,
            paymentTerms: true,
            latePenaltyRateBps: true,
            fixedCompensationCents: true,
        },
    });
    return res.json({ company });
});

export default router;
