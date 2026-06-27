import type { Request, Response } from "express";
import {
    KahierServiceError,
    createCategoryTab,
    createPeriodeTab,
    createPlanningEvent,
    createPlanningLegend,
    createTask,
    getApiKeyScopes,
    getEstablishmentUsers,
    getPlannings,
    getPlanningLegends,
    getZoneData,
    getCategoryTasks,
    setTaskCompletion,
    updateCategoryLink,
} from "../services/kahier.service.js";
import type { KahierTaskPayload } from "../types/kahier.types.js";

function getParamValue(req: Request, key: string) {
    const value = (req.params as Record<string, string | string[] | undefined>)[key];
    if (!value) return null;
    return Array.isArray(value) ? value[0] : value;
}

function getApiKeyFromRequest(req: Request) {
    const raw = req.header("x-api-key");
    if (!raw) return null;
    return raw.trim() || null;
}

export async function getZone(req: Request, res: Response) {
    const zoneId = getParamValue(req, "zoneId");
    if (!zoneId) {
        return res.status(400).json({ error: "zoneId requis" });
    }

    try {
        const data = await getZoneData(zoneId, getApiKeyFromRequest(req));
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
        const task = await createTask(payload, getApiKeyFromRequest(req));
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
        const users = await getEstablishmentUsers(getApiKeyFromRequest(_req));
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
        const plannings = await getPlannings(getApiKeyFromRequest(_req));
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
        const legends = await getPlanningLegends(planningId, mode, getApiKeyFromRequest(req));
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
        const event = await createPlanningEvent(req.body ?? {}, getApiKeyFromRequest(req));
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
        }, getApiKeyFromRequest(req));
        return res.status(201).json(legend);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier legend create:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function getScopes(req: Request, res: Response) {
    try {
        const data = await getApiKeyScopes(getApiKeyFromRequest(req));
        return res.json(data);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier scopes:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function postPeriodeTab(req: Request, res: Response) {
    const body = req.body as { name?: unknown; zoneId?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const zoneId = Number(body.zoneId);
    if (!name) {
        return res.status(400).json({ error: "name requis" });
    }
    if (!Number.isInteger(zoneId) || zoneId <= 0) {
        return res.status(400).json({ error: "zoneId requis" });
    }

    try {
        const tab = await createPeriodeTab({ name, zoneId }, getApiKeyFromRequest(req));
        return res.status(201).json(tab);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier create tab:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function postCategory(req: Request, res: Response) {
    const body = req.body as { name?: unknown; tabId?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const tabId = Number(body.tabId);
    if (!name) {
        return res.status(400).json({ error: "name requis" });
    }
    if (!Number.isInteger(tabId) || tabId <= 0) {
        return res.status(400).json({ error: "tabId requis" });
    }

    try {
        const category = await createCategoryTab({ name, tabId }, getApiKeyFromRequest(req));
        return res.status(201).json(category);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier create category:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function patchCategory(req: Request, res: Response) {
    const categoryId = Number(getParamValue(req, "categoryId"));
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.status(400).json({ error: "categoryId requis" });
    }

    const body = req.body as { periodeTabId?: unknown; crmProjectId?: unknown; crmProjectName?: unknown };
    const periodeTabId = Number(body.periodeTabId);
    if (!Number.isInteger(periodeTabId) || periodeTabId <= 0) {
        return res.status(400).json({ error: "periodeTabId requis" });
    }

    const crmProjectId = body.crmProjectId === null
        ? null
        : typeof body.crmProjectId === "string" && body.crmProjectId.trim()
            ? body.crmProjectId.trim()
            : undefined;
    const crmProjectName = body.crmProjectName === null
        ? null
        : typeof body.crmProjectName === "string" && body.crmProjectName.trim()
            ? body.crmProjectName.trim()
            : undefined;

    const hasProjectId = crmProjectId !== undefined;
    const hasProjectName = crmProjectName !== undefined;

    if (!hasProjectId || !hasProjectName) {
        return res.status(400).json({ error: "crmProjectId et crmProjectName sont requis" });
    }

    try {
        const category = await updateCategoryLink(
            categoryId,
            { periodeTabId, crmProjectId, crmProjectName },
            getApiKeyFromRequest(req),
        );
        return res.json(category);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier patch category:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function getCategoryTasksController(req: Request, res: Response) {
    const categoryId = Number(getParamValue(req, "categoryId"));
    const periodeTabId = typeof req.query.periodeTabId === "string" ? Number(req.query.periodeTabId) : Number.NaN;

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.status(400).json({ error: "categoryId requis" });
    }

    if (!Number.isInteger(periodeTabId) || periodeTabId <= 0) {
        return res.status(400).json({ error: "periodeTabId requis" });
    }

    try {
        const tasks = await getCategoryTasks(categoryId, periodeTabId, getApiKeyFromRequest(req));
        return res.json(tasks);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier category tasks:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}

export async function patchTaskCompletion(req: Request, res: Response) {
    const taskId = Number(getParamValue(req, "taskId"));
    if (!Number.isInteger(taskId) || taskId <= 0) {
        return res.status(400).json({ error: "taskId requis" });
    }

    const body = req.body as { categoryId?: unknown; periodeTabId?: unknown; completed?: unknown };
    const categoryId = Number(body.categoryId);
    const periodeTabId = Number(body.periodeTabId);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return res.status(400).json({ error: "categoryId requis" });
    }

    if (!Number.isInteger(periodeTabId) || periodeTabId <= 0) {
        return res.status(400).json({ error: "periodeTabId requis" });
    }

    if (typeof body.completed !== "boolean") {
        return res.status(400).json({ error: "completed requis" });
    }

    try {
        const task = await setTaskCompletion(
            taskId,
            {
                categoryId,
                periodeTabId,
                completed: body.completed,
            },
            getApiKeyFromRequest(req),
        );
        return res.json(task);
    } catch (error) {
        if (error instanceof KahierServiceError) {
            return res.status(error.status).json({ error: error.message });
        }
        console.error("Erreur kahier patch task completion:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
}
