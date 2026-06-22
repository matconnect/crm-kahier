import type { Request, Response } from "express";
import { getCurrentUser, getParamValue } from "../lib/current-user.js";
import { generateInvoicePdf } from "../services/invoice-pdf.service.js";
import * as service from "../services/invoices.service.js";

function ensureBillingAccess(subscriptionType: string, res: Response): boolean {
    if (subscriptionType !== "STARTER_FREE") return true;
    res.status(402).json({ error: "Fonctionnalité réservée à un abonnement Pro." });
    return false;
}

function sendError(res: Response, error: unknown, fallback: string) {
    if (error instanceof service.InvoiceDomainError) {
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
        sendError(res, error, "Impossible de charger les factures.");
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
        sendError(res, error, "Impossible de créer la facture.");
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
        sendError(res, error, "Impossible de charger la facture.");
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
        sendError(res, error, "Impossible de modifier la facture.");
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
        sendError(res, error, "Impossible de valider la facture.");
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
        res.json(await service.updateStatus(id, currentUser, req.body?.status, req.body?.paidAt));
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
        sendError(res, error, "Impossible de supprimer la facture.");
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
        const invoice = await service.getById(id, currentUser);
        const pdf = generateInvoicePdf(invoice);
        res.setHeader("content-type", "application/pdf");
        res.setHeader("content-disposition", `attachment; filename="${invoice.number}.pdf"`);
        res.setHeader("content-length", String(pdf.byteLength));
        res.send(pdf);
    } catch (error) {
        sendError(res, error, "Impossible de générer le PDF.");
    }
}
