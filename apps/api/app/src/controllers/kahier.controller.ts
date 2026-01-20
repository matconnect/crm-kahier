import type { Request, Response } from "express";
import { KahierServiceError, createTask, getZoneData } from "../services/kahier.service";
import type { KahierTaskPayload } from "../types/kahier.types";

export async function getZone(req: Request, res: Response) {
    const { zoneId } = req.params;
    if (!zoneId) {
        return res.status(400).json({ error: "zoneId requis" });
    }

    try {
        const data = await getZoneData(zoneId);
        return res.json(data);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier zone:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function postTask(req: Request, res: Response) {
    const payload = req.body as KahierTaskPayload;
    if (!payload?.name || !payload?.categoryId) {
        return res.status(400).json({ error: "name et categoryId requis" });
    }

    try {
        const task = await createTask(payload);
        return res.status(201).json(task);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier task:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}
