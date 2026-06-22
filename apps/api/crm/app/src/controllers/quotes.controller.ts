import type { Request, Response } from "express";
import { getCurrentUser, getParamValue } from "../lib/current-user.js";
import { generateQuotePdf } from "../services/quote-pdf.service.js";
import * as service from "../services/quotes.service.js";

function ensureBillingAccess(subscriptionType: string, res: Response): boolean {
    if (subscriptionType !== "STARTER_FREE") return true;
    res.status(402).json({ error: "Fonctionnalité réservée à un abonnement Pro." });
    return false;
}

function sendError(res: Response, error: unknown, fallback: string) {
    if (error instanceof service.QuoteDomainError) {
        res.status(error.statusCode).json({ error: error.message, details: error.details });
        return;
    }
    console.error(fallback, error);
    res.status(500).json({ error: fallback });
}

export async function list(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        res.json(
            await service.list(currentUser, {
                q: typeof req.query.q === "string" ? req.query.q : undefined,
                status: typeof req.query.status === "string" ? req.query.status : undefined,
                clientId: typeof req.query.clientId === "string" ? req.query.clientId : undefined,
                page: Number(req.query.page ?? 1),
                pageSize: Number(req.query.pageSize ?? 20),
            }),
        );
    } catch (error) {
        sendError(res, error, "Impossible de charger les devis.");
    }
}

export async function summary(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        res.json(await service.summary(currentUser));
    } catch (error) {
        sendError(res, error, "Impossible de charger la synthèse.");
    }
}

export async function create(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        res.status(201).json(await service.create(currentUser, req.body ?? {}));
    } catch (error) {
        sendError(res, error, "Impossible de créer le devis.");
    }
}

export async function getById(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    const id = getParamValue(req, "id");
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!id) {
        res.status(400).json({ error: "Identifiant requis." });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        res.json(await service.getById(id, currentUser));
    } catch (error) {
        sendError(res, error, "Impossible de charger le devis.");
    }
}

export async function update(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    const id = getParamValue(req, "id");
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!id) {
        res.status(400).json({ error: "Identifiant requis." });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        res.json(await service.update(id, currentUser, req.body ?? {}));
    } catch (error) {
        sendError(res, error, "Impossible de modifier le devis.");
    }
}

export async function validate(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    const id = getParamValue(req, "id");
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!id) {
        res.status(400).json({ error: "Identifiant requis." });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        res.json(await service.validate(id, currentUser));
    } catch (error) {
        sendError(res, error, "Impossible de valider le devis.");
    }
}

export async function updateStatus(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    const id = getParamValue(req, "id");
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!id) {
        res.status(400).json({ error: "Identifiant requis." });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        res.json(await service.updateStatus(id, currentUser, req.body?.status, req.body?.acceptedAt));
    } catch (error) {
        sendError(res, error, "Impossible de modifier le statut.");
    }
}

export async function remove(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    const id = getParamValue(req, "id");
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!id) {
        res.status(400).json({ error: "Identifiant requis." });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        await service.remove(id, currentUser);
        res.status(204).send();
    } catch (error) {
        sendError(res, error, "Impossible de supprimer le devis.");
    }
}

export async function downloadPdf(req: Request, res: Response): Promise<void> {
    const currentUser = await getCurrentUser(req);
    const id = getParamValue(req, "id");
    if (!currentUser) {
        res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
        return;
    }
    if (!id) {
        res.status(400).json({ error: "Identifiant requis." });
        return;
    }
    if (!ensureBillingAccess(currentUser.subscriptionType, res)) return;
    try {
        const quote = await service.getById(id, currentUser);
        const pdf = generateQuotePdf(quote);
        res.setHeader("content-type", "application/pdf");
        res.setHeader("content-disposition", `attachment; filename="${quote.number}.pdf"`);
        res.setHeader("content-length", String(pdf.byteLength));
        res.send(pdf);
    } catch (error) {
        sendError(res, error, "Impossible de générer le PDF.");
    }
}
