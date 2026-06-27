import type { Request, Response } from "express";
import { prisma, Prisma, ProjectPriority, ProjectStatus } from "@kahier/db-crm";
import * as service from "../services/projects.service.js";
import { getCurrentUser, getParamValue, type CurrentUser } from "../lib/current-user.js";

function hasFinanceAccess(subscriptionType: string) {
    return subscriptionType !== "STARTER_FREE";
}

function sanitizeFinancialProject<T extends Record<string, unknown>>(project: T): T {
    return {
        ...project,
        budgetAmount: null,
        revenueAmount: null,
        costAmount: null,
        invoicedAmount: null,
        receivedAmount: null,
    };
}

async function ensureCanViewProject(projectId: string, currentUser: CurrentUser) {
    if (currentUser.role !== "USER") return true;
    const project = await prisma.project.findFirst({
        where: { id: projectId, companyId: currentUser.companyId, ownerId: currentUser.id },
        select: { id: true },
    });
    return Boolean(project);
}

async function ensureCanEditProject(projectId: string, currentUser: CurrentUser) {
    if (currentUser.role === "ADMIN") return true;
    const project = await prisma.project.findFirst({
        where: { id: projectId, companyId: currentUser.companyId, ownerId: currentUser.id },
        select: { id: true },
    });
    return Boolean(project);
}

function normalizeStatus(value: unknown) {
    return typeof value === "string" && Object.values(ProjectStatus).includes(value as ProjectStatus)
        ? (value as ProjectStatus)
        : undefined;
}

function normalizePriority(value: unknown) {
    return typeof value === "string" && Object.values(ProjectPriority).includes(value as ProjectPriority)
        ? (value as ProjectPriority)
        : undefined;
}

function normalizeDate(value: unknown) {
    if (!value) return undefined;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeProgress(value: unknown) {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeOptionalString(value: unknown) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function normalizeOptionalNumber(value: unknown) {
    if (value === undefined || value === null || value === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.round(parsed);
}

function normalizeOptionalInteger(value: unknown) {
    const parsed = normalizeOptionalNumber(value);
    if (parsed === null) return null;
    if (parsed === undefined) return undefined;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function normalizeTaskCompletionState(value: unknown) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;

    const entries = Object.entries(value as Record<string, unknown>).filter(
        ([taskId, checked]) => taskId.trim() && typeof checked === "boolean",
    );

    if (!entries.length) return null;
    return JSON.stringify(Object.fromEntries(entries));
}

export async function list(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });

    const result = await service.list({
        q: (req.query.q as string) ?? "",
        status: (req.query.status as string) ?? undefined,
        priority: (req.query.priority as string) ?? undefined,
        clientId: (req.query.clientId as string) ?? undefined,
        page: Number(req.query.page ?? 1),
        pageSize: Number(req.query.pageSize ?? 20),
        companyId: currentUser.companyId,
        ...(currentUser.role === "USER" ? { assignedUserId: currentUser.id } : {}),
    });

    const financeAllowed = hasFinanceAccess(currentUser.subscriptionType);
    if (!financeAllowed) {
        res.json({ ...result, items: result.items.map((item) => sanitizeFinancialProject(item)) });
        return;
    }
    res.json(result);
}

export async function summary(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    if (!hasFinanceAccess(currentUser.subscriptionType)) {
        return res.status(402).json({ error: "Fonctionnalité réservée à un abonnement Pro." });
    }
    res.json(await service.summary(currentUser.companyId));
}

export async function create(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name) return res.status(400).json({ error: "Le nom du projet est requis" });

    const clientId = typeof req.body?.clientId === "string" && req.body.clientId.trim() ? req.body.clientId.trim() : null;
    if (clientId) {
        try {
            await service.assertClientBelongsToCompany(clientId, currentUser.companyId);
        } catch {
            return res.status(400).json({ error: "Le client selectionne est introuvable dans cette entreprise" });
        }
    }

    const requestedOwnerId =
        typeof req.body?.ownerId === "string" && req.body.ownerId.trim() ? req.body.ownerId.trim() : null;
    const ownerId = currentUser.role === "ADMIN" ? requestedOwnerId ?? currentUser.id : currentUser.id;
    if (ownerId) {
        try {
            await service.assertUserBelongsToCompany(ownerId, currentUser.companyId);
        } catch {
            return res.status(400).json({ error: "Le responsable selectionne est introuvable dans cette entreprise" });
        }
    }

    const payload = {
        name,
        reference: normalizeOptionalString(req.body?.reference),
        description: typeof req.body?.description === "string" ? req.body.description.trim() || null : null,
        context: normalizeOptionalString(req.body?.context),
        goals: normalizeOptionalString(req.body?.goals),
        deliverables: normalizeOptionalString(req.body?.deliverables),
        successMetrics: normalizeOptionalString(req.body?.successMetrics),
        risks: normalizeOptionalString(req.body?.risks),
        notes: normalizeOptionalString(req.body?.notes),
        status: normalizeStatus(req.body?.status) ?? ProjectStatus.DRAFT,
        priority: normalizePriority(req.body?.priority) ?? ProjectPriority.MEDIUM,
        progress: normalizeProgress(req.body?.progress) ?? 0,
        budgetAmount: normalizeOptionalNumber(req.body?.budgetAmount) ?? null,
        revenueAmount: normalizeOptionalNumber(req.body?.revenueAmount) ?? null,
        costAmount: normalizeOptionalNumber(req.body?.costAmount) ?? null,
        invoicedAmount: normalizeOptionalNumber(req.body?.invoicedAmount) ?? null,
        receivedAmount: normalizeOptionalNumber(req.body?.receivedAmount) ?? null,
        billingMode: normalizeOptionalString(req.body?.billingMode),
        startDate: normalizeDate(req.body?.startDate) ?? null,
        endDate: normalizeDate(req.body?.endDate) ?? null,
        kahierTabId: normalizeOptionalInteger(req.body?.kahierTabId) ?? null,
        kahierCategoryId: normalizeOptionalInteger(req.body?.kahierCategoryId) ?? null,
        kahierCategoryName: normalizeOptionalString(req.body?.kahierCategoryName),
        kahierTaskCompletionState: normalizeTaskCompletionState(req.body?.kahierTaskCompletionState) ?? null,
        company: { connect: { id: currentUser.companyId } },
        ...(clientId ? { client: { connect: { id: clientId } } } : {}),
        ...(ownerId ? { owner: { connect: { id: ownerId } } } : {}),
    } as Parameters<typeof service.create>[0];

    try {
        const project = await service.create(payload);
        if (!hasFinanceAccess(currentUser.subscriptionType)) {
            return res.status(201).json(sanitizeFinancialProject(project));
        }
        res.status(201).json(project);
    } catch (error) {
        console.error("createProject", error);
        res.status(500).json({ error: "Impossible de creer le projet" });
    }
}

export async function getById(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const projectId = getParamValue(req, "id");
    if (!projectId) return res.status(400).json({ error: "ID is required" });
    if (!(await ensureCanViewProject(projectId, currentUser))) {
        return res.status(403).json({ error: "Acces refuse" });
    }

    try {
        const project = await service.getById(projectId, currentUser.companyId);
        if (!hasFinanceAccess(currentUser.subscriptionType)) {
            return res.json(sanitizeFinancialProject(project));
        }
        res.json(project);
    } catch {
        res.status(404).json({ error: "Projet introuvable" });
    }
}

export async function update(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const projectId = getParamValue(req, "id");
    if (!projectId) return res.status(400).json({ error: "ID is required" });
    if (!(await ensureCanEditProject(projectId, currentUser))) {
        return res.status(403).json({ error: "Acces refuse" });
    }

    const data: Prisma.ProjectUpdateInput & {
        kahierTabId?: number | null;
        kahierCategoryId?: number | null;
        kahierCategoryName?: string | null;
    } = {};
    if ("name" in (req.body ?? {})) {
        const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
        if (!name) return res.status(400).json({ error: "Le nom du projet est requis" });
        data.name = name;
    }
    if ("description" in (req.body ?? {})) {
        data.description = typeof req.body?.description === "string" ? req.body.description.trim() || null : null;
    }
    if ("reference" in (req.body ?? {})) {
        data.reference = normalizeOptionalString(req.body?.reference);
    }
    if ("context" in (req.body ?? {})) {
        data.context = normalizeOptionalString(req.body?.context);
    }
    if ("goals" in (req.body ?? {})) {
        data.goals = normalizeOptionalString(req.body?.goals);
    }
    if ("deliverables" in (req.body ?? {})) {
        data.deliverables = normalizeOptionalString(req.body?.deliverables);
    }
    if ("successMetrics" in (req.body ?? {})) {
        data.successMetrics = normalizeOptionalString(req.body?.successMetrics);
    }
    if ("risks" in (req.body ?? {})) {
        data.risks = normalizeOptionalString(req.body?.risks);
    }
    if ("notes" in (req.body ?? {})) {
        data.notes = normalizeOptionalString(req.body?.notes);
    }
    if ("status" in (req.body ?? {})) {
        const status = normalizeStatus(req.body?.status);
        if (!status) return res.status(400).json({ error: "Statut projet invalide" });
        data.status = status;
    }
    if ("priority" in (req.body ?? {})) {
        const priority = normalizePriority(req.body?.priority);
        if (!priority) return res.status(400).json({ error: "Priorite projet invalide" });
        data.priority = priority;
    }
    if ("progress" in (req.body ?? {})) {
        const progress = normalizeProgress(req.body?.progress);
        if (progress === undefined) return res.status(400).json({ error: "Progression invalide" });
        data.progress = progress;
    }
    if ("budgetAmount" in (req.body ?? {})) {
        const budgetAmount = normalizeOptionalNumber(req.body?.budgetAmount);
        if (budgetAmount === undefined) return res.status(400).json({ error: "Budget invalide" });
        data.budgetAmount = budgetAmount;
    }
    if ("revenueAmount" in (req.body ?? {})) {
        const revenueAmount = normalizeOptionalNumber(req.body?.revenueAmount);
        if (revenueAmount === undefined) return res.status(400).json({ error: "Revenu prévisionnel invalide" });
        data.revenueAmount = revenueAmount;
    }
    if ("costAmount" in (req.body ?? {})) {
        const costAmount = normalizeOptionalNumber(req.body?.costAmount);
        if (costAmount === undefined) return res.status(400).json({ error: "Coût projet invalide" });
        data.costAmount = costAmount;
    }
    if ("invoicedAmount" in (req.body ?? {})) {
        const invoicedAmount = normalizeOptionalNumber(req.body?.invoicedAmount);
        if (invoicedAmount === undefined) return res.status(400).json({ error: "Montant facturé invalide" });
        data.invoicedAmount = invoicedAmount;
    }
    if ("receivedAmount" in (req.body ?? {})) {
        const receivedAmount = normalizeOptionalNumber(req.body?.receivedAmount);
        if (receivedAmount === undefined) return res.status(400).json({ error: "Montant encaissé invalide" });
        data.receivedAmount = receivedAmount;
    }
    if ("billingMode" in (req.body ?? {})) {
        data.billingMode = normalizeOptionalString(req.body?.billingMode);
    }
    if ("startDate" in (req.body ?? {})) {
        data.startDate = normalizeDate(req.body?.startDate) ?? null;
    }
    if ("endDate" in (req.body ?? {})) {
        data.endDate = normalizeDate(req.body?.endDate) ?? null;
    }
    if ("kahierTabId" in (req.body ?? {})) {
        const kahierTabId = normalizeOptionalInteger(req.body?.kahierTabId);
        if (kahierTabId === undefined) return res.status(400).json({ error: "Onglet Kahier invalide" });
        data.kahierTabId = kahierTabId;
    }
    if ("kahierCategoryId" in (req.body ?? {})) {
        const kahierCategoryId = normalizeOptionalInteger(req.body?.kahierCategoryId);
        if (kahierCategoryId === undefined) return res.status(400).json({ error: "Catégorie Kahier invalide" });
        data.kahierCategoryId = kahierCategoryId;
    }
    if ("kahierCategoryName" in (req.body ?? {})) {
        data.kahierCategoryName = normalizeOptionalString(req.body?.kahierCategoryName);
    }
    if ("kahierTaskCompletionState" in (req.body ?? {})) {
        const kahierTaskCompletionState = normalizeTaskCompletionState(req.body?.kahierTaskCompletionState);
        if (kahierTaskCompletionState === undefined) {
            return res.status(400).json({ error: "État des tâches Kahier invalide" });
        }
        data.kahierTaskCompletionState = kahierTaskCompletionState;
    }
    if ("clientId" in (req.body ?? {})) {
        const clientId = typeof req.body?.clientId === "string" && req.body.clientId.trim() ? req.body.clientId.trim() : null;
        if (clientId) {
            try {
                await service.assertClientBelongsToCompany(clientId, currentUser.companyId);
            } catch {
                return res.status(400).json({ error: "Le client selectionne est introuvable dans cette entreprise" });
            }
            data.client = { connect: { id: clientId } };
        } else {
            data.client = { disconnect: true };
        }
    }
    if ("ownerId" in (req.body ?? {}) && currentUser.role === "ADMIN") {
        const ownerId = typeof req.body?.ownerId === "string" && req.body.ownerId.trim() ? req.body.ownerId.trim() : null;
        if (ownerId) {
            try {
                await service.assertUserBelongsToCompany(ownerId, currentUser.companyId);
            } catch {
                return res.status(400).json({ error: "Le responsable selectionne est introuvable dans cette entreprise" });
            }
            data.owner = { connect: { id: ownerId } };
        } else {
            data.owner = { disconnect: true };
        }
    }

    try {
        const project = await service.update(projectId, currentUser.companyId, data);
        if (!hasFinanceAccess(currentUser.subscriptionType)) {
            return res.json(sanitizeFinancialProject(project));
        }
        res.json(project);
    } catch (error) {
        console.error("updateProject", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const target = error.meta?.target;
            const targetFields = Array.isArray(target) ? target.map(String) : typeof target === "string" ? [target] : [];
            if (error.code === "P2002" && targetFields.includes("kahierCategoryId")) {
                return res.status(409).json({ error: "Cette catégorie Kahier est déjà liée à un autre projet" });
            }
        }
        if (error instanceof Prisma.PrismaClientValidationError) {
            return res.status(400).json({ error: "Les données envoyées pour le projet sont invalides" });
        }
        res.status(500).json({ error: "Impossible de mettre à jour le projet" });
    }
}

export async function remove(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const projectId = getParamValue(req, "id");
    if (!projectId) return res.status(400).json({ error: "ID is required" });
    if (!(await ensureCanEditProject(projectId, currentUser))) {
        return res.status(403).json({ error: "Acces refuse" });
    }

    await service.remove(projectId, currentUser.companyId);
    res.status(204).send();
}
