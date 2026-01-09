import type { Request, Response } from "express";
import { prisma } from "@kahier/db";
import * as service from "../services/clients.service";

async function getCompanyId(req: Request): Promise<string | null> {
    const companyId = (req.headers["x-company-id"] as string | undefined)?.trim();
    if (companyId) return companyId;

    const userId = (req.headers["x-user-id"] as string | undefined)?.trim();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true },
    });
    return user?.companyId ?? null;
}

export async function list(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    const result = await service.list({
        q: (req.query.q as string) ?? "",
        status: (req.query.status as string) ?? undefined,
        segment: (req.query.segment as string) ?? undefined,
        location: (req.query.location as string) ?? undefined,
        page: Number(req.query.page ?? 1),
        pageSize: Number(req.query.pageSize ?? 20),
        companyId,
    });
    res.json(result);
}

export async function summary(_req: Request, res: Response) {
    const companyId = await getCompanyId(_req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    res.json(await service.summary(companyId));
}

export async function create(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    res.status(201).json(await service.create({ ...req.body, companyId }));
}

export async function getById(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    if (!req.params.id) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    res.json(await service.getById(req.params.id, companyId));
}

export async function update(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    if (!req.params.id) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    res.json(await service.update(req.params.id, companyId, req.body));
}

export async function remove(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    if (!req.params.id) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    await service.remove(req.params.id, companyId);
    res.status(204).send();
}

export async function logInteraction(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    const clientId = req.params.id;
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }

    const type = typeof req.body?.type === "string" ? req.body.type.trim() : "";
    const summary = typeof req.body?.summary === "string" ? req.body.summary.trim() : undefined;
    const occurredAt = req.body?.occurredAt ? new Date(req.body.occurredAt) : undefined;
    const userId = typeof req.body?.userId === "string" ? req.body.userId.trim() : undefined;

    if (!type || !userId) {
        res.status(400).json({ error: "Type et utilisateur requis" });
        return;
    }

    try {
        const interaction = await service.addInteraction(clientId, companyId, { type, summary, occurredAt, userId });
        res.status(201).json({ interaction });
    } catch (error) {
        console.error("logInteraction", error);
        res.status(500).json({ error: "Impossible d'enregistrer l'interaction" });
    }
}

export async function addContact(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    const clientId = req.params.id;
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }

    const firstName = typeof req.body?.firstName === "string" ? req.body.firstName : undefined;
    const lastName = typeof req.body?.lastName === "string" ? req.body.lastName : undefined;
    const email = typeof req.body?.email === "string" ? req.body.email : undefined;
    const phone = typeof req.body?.phone === "string" ? req.body.phone : undefined;
    const role = typeof req.body?.role === "string" ? req.body.role : undefined;

    if (!firstName && !lastName && !email && !phone && !role) {
        res.status(400).json({ error: "Au moins une info de contact est requise" });
        return;
    }

    try {
        const contact = await service.addContact(clientId, companyId, { firstName, lastName, email, phone, role });
        res.status(201).json({ contact });
    } catch (error) {
        console.error("addContact", error);
        res.status(500).json({ error: "Impossible d'ajouter le contact" });
    }
}

export async function updateInteraction(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    const interactionId = req.params.interactionId;
    if (!interactionId) {
        res.status(400).json({ error: "interactionId is required" });
        return;
    }

    const type = typeof req.body?.type === "string" ? req.body.type.trim() : undefined;
    const summary = typeof req.body?.summary === "string" ? req.body.summary.trim() : undefined;
    const occurredAt = req.body?.occurredAt ? new Date(req.body.occurredAt) : undefined;
    const userId = typeof req.body?.userId === "string" ? req.body.userId.trim() : undefined;

    if (!type && !summary && !occurredAt && userId === undefined) {
        res.status(400).json({ error: "Aucune donnée à mettre à jour" });
        return;
    }

    try {
        const interaction = await service.updateInteraction(interactionId, companyId, { type, summary, occurredAt, userId });
        res.json({ interaction });
    } catch (error) {
        console.error("updateInteraction", error);
        res.status(500).json({ error: "Impossible de mettre à jour l'interaction" });
    }
}

export async function deleteInteraction(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    const interactionId = req.params.interactionId;
    if (!interactionId) {
        res.status(400).json({ error: "interactionId is required" });
        return;
    }

    try {
        await service.deleteInteraction(interactionId, companyId);
        res.status(204).send();
    } catch (error) {
        console.error("deleteInteraction", error);
        res.status(500).json({ error: "Impossible de supprimer l'interaction" });
    }
}

export async function deleteContact(req: Request, res: Response) {
    const companyId = await getCompanyId(req);
    if (!companyId) return res.status(401).json({ error: "CompanyId requis" });
    const contactId = req.params.contactId;
    if (!contactId) {
        res.status(400).json({ error: "contactId is required" });
        return;
    }

    try {
        await service.deleteContact(contactId, companyId);
        res.status(204).send();
    } catch (error) {
        console.error("deleteContact", error);
        res.status(500).json({ error: "Impossible de supprimer le contact" });
    }
}
