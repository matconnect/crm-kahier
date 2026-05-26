import type { Request, Response } from "express";
import {
    KahierServiceError,
    createPlanningEvent,
    createPlanningLegend,
    createTask,
    getEstablishmentUsers,
    getPlannings,
    getPlanningLegends,
    getZoneData,
} from "../services/kahier.service.js";
import type { KahierTaskPayload } from "../types/kahier.types.js";

function getParamValue(req: Request, key: string) {
    const value = (req.params as Record<string, string | string[] | undefined>)[key];
    if (!value) return null;
    return Array.isArray(value) ? value[0] : value;
}

export async function getZone(req: Request, res: Response) {
    const zoneId = getParamValue(req, "zoneId");
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

export async function getUsers(_req: Request, res: Response) {
    try {
        const users = await getEstablishmentUsers();
        return res.json(users);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier users:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function getPlanningsController(_req: Request, res: Response) {
    try {
        const plannings = await getPlannings();
        return res.json(plannings);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier plannings:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function getPlanningLegendsController(req: Request, res: Response) {
    const planningId = getParamValue(req, "planningId");
    const mode = typeof req.query.mode === "string" ? req.query.mode : "classic";
    if (!planningId) {
        return res.status(400).json({ error: "planningId requis" });
    }

    try {
        const legends = await getPlanningLegends(planningId, mode);
        return res.json(legends);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier legends:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function postPlanningEvent(req: Request, res: Response) {
    try {
        const event = await createPlanningEvent(req.body ?? {});
        return res.status(201).json(event);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier planning create:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function postPlanningLegend(req: Request, res: Response) {
    const body = req.body as {
        label?: unknown;
        color?: unknown;
        selectedPlanningId?: unknown;
        agenda_principal?: unknown;
    };

    if (typeof body.label !== "string" || !body.label.trim()) {
        return res.status(400).json({ error: "label requis" });
    }
    if (typeof body.color !== "string" || !body.color.trim()) {
        return res.status(400).json({ error: "color requis" });
    }
    if (!Number.isInteger(body.selectedPlanningId)) {
        return res.status(400).json({ error: "selectedPlanningId requis" });
    }

    try {
        const legend = await createPlanningLegend({
            label: body.label.trim(),
            color: body.color.trim(),
            selectedPlanningId: Number(body.selectedPlanningId),
            agenda_principal: body.agenda_principal === false ? false : true,
        });
        return res.status(201).json(legend);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier legend create:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}
