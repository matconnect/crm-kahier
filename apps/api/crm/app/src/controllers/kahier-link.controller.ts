import type { Request, Response } from "express";
import * as service from "../services/kahier-link.service.js";
import { getCurrentUser } from "../lib/current-user.js";

export async function getStatus(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });

    try {
        const status = await service.getStatus(currentUser.companyId);
        return res.json(status);
    } catch (error) {
        console.error("kahier-link getStatus", error);
        return res.status(500).json({ error: "Impossible de récupérer l'intégration Kahier." });
    }
}

export async function createCode(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    if (currentUser.role === "USER") return res.status(403).json({ error: "Accès refusé" });

    try {
        const result = await service.createLinkCode({
            companyId: currentUser.companyId,
            createdByUserId: currentUser.id,
        });
        return res.status(201).json(result);
    } catch (error) {
        console.error("kahier-link createCode", error);
        return res.status(500).json({ error: "Impossible de générer un code de liaison." });
    }
}

export async function confirmCode(req: Request, res: Response) {
    const body = (req.body ?? {}) as {
        code?: unknown;
        kahierEstablishmentId?: unknown;
        kahierEstablishmentName?: unknown;
        kahierZoneId?: unknown;
        kahierZoneName?: unknown;
        kahierUserId?: unknown;
        kahierUserLabel?: unknown;
    };

    if (typeof body.code !== "string" || !body.code.trim()) {
        return res.status(400).json({ error: "Code requis" });
    }
    if (!Number.isInteger(body.kahierEstablishmentId)) {
        return res.status(400).json({ error: "kahierEstablishmentId requis" });
    }
    if (typeof body.kahierEstablishmentName !== "string" || !body.kahierEstablishmentName.trim()) {
        return res.status(400).json({ error: "kahierEstablishmentName requis" });
    }

    try {
        const result = await service.confirmLinkCode({
            code: body.code,
            kahierEstablishmentId: Number(body.kahierEstablishmentId),
            kahierEstablishmentName: body.kahierEstablishmentName.trim(),
            kahierZoneId: Number.isInteger(body.kahierZoneId) ? Number(body.kahierZoneId) : null,
            kahierZoneName: typeof body.kahierZoneName === "string" ? body.kahierZoneName.trim() || null : null,
            kahierUserId: Number.isInteger(body.kahierUserId) ? Number(body.kahierUserId) : null,
            kahierUserLabel: typeof body.kahierUserLabel === "string" ? body.kahierUserLabel.trim() || null : null,
        });
        return res.json(result);
    } catch (error) {
        if (error instanceof service.KahierLinkError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("kahier-link confirmCode", error);
        return res.status(500).json({ error: "Impossible de confirmer la liaison Kahier." });
    }
}

export async function saveApiKey(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    if (currentUser.role === "USER") return res.status(403).json({ error: "Accès refusé" });

    const body = (req.body ?? {}) as { apiKey?: unknown };
    if (typeof body.apiKey !== "string" || !body.apiKey.trim()) {
        return res.status(400).json({ error: "apiKey requis" });
    }

    try {
        const result = await service.saveApiKey({
            companyId: currentUser.companyId,
            apiKey: body.apiKey.trim(),
        });
        return res.json(result);
    } catch (error) {
        if (error instanceof service.KahierLinkError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("kahier-link saveApiKey", error);
        return res.status(500).json({ error: "Impossible d'enregistrer la clé API Kahier." });
    }
}

export async function deleteApiKey(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    if (currentUser.role === "USER") return res.status(403).json({ error: "Accès refusé" });

    try {
        const result = await service.deleteApiKey({
            companyId: currentUser.companyId,
        });
        return res.json(result);
    } catch (error) {
        if (error instanceof service.KahierLinkError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("kahier-link deleteApiKey", error);
        return res.status(500).json({ error: "Impossible de supprimer la clé API Kahier." });
    }
}
