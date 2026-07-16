import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    KahierServiceError,
    createCategoryTab,
    createPeriodeTab,
    createPlanningEvent,
    createPlanningLegend,
    createTask,
    getApiKeyScopes,
    getCategoryTasks,
    getEstablishmentUsers,
    getPlanningLegends,
    getPlannings,
    getZoneData,
    setTaskCompletion,
    updateCategoryLink,
} from "./kahier.service.js";

const fetchMock = vi.fn();
const baseUrl = "https://kahier.test";
const task = (overrides: Record<string, unknown> = {}) => ({
    id: 1,
    name: "Task",
    completed: false,
    priority: null,
    isRecurring: false,
    displayOrder: 1,
    updatedAt: "2026-07-01",
    categoryId: 2,
    assignedUsers: [],
    ...overrides,
});
const category = (overrides: Record<string, unknown> = {}) => ({
    id: 2,
    name: "Category",
    displayOrder: 1,
    periodeTabId: 3,
    createdAt: "2026-07-01",
    updatedAt: "2026-07-01",
    assignedUsers: [],
    ...overrides,
});

function response(body: unknown, status = 200): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    } as Response;
}

function fail(status: number, body: unknown = { error: "Upstream failed" }) {
    fetchMock.mockResolvedValueOnce(response(body, status));
}

beforeEach(() => {
    vi.stubEnv("KAHIER_API_BASE", baseUrl);
    vi.stubEnv("KAHIER_API_BASE_FILE", "");
    vi.stubEnv("KAHIER_API_KEY", "env-key");
    vi.stubEnv("KAHIER_API_KEY_FILE", "");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
});

afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

describe("KahierServiceError", () => {
    it("keeps its message and status", () => {
        const error = new KahierServiceError("bad request", 422);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("bad request");
        expect(error.status).toBe(422);
    });
});

describe("Kahier upstream service", () => {
    it.each([
        ["getZoneData", () => getZoneData("1")],
        ["createTask", () => createTask({} as never)],
        ["getEstablishmentUsers", () => getEstablishmentUsers()],
        ["getPlannings", () => getPlannings()],
        ["getApiKeyScopes", () => getApiKeyScopes()],
    ])("requires the API base URL for %s", async (_name, call) => {
        vi.stubEnv("KAHIER_API_BASE", "");
        vi.stubEnv("KAHIER_API_BASE_FILE", "");
        await expect(call()).rejects.toThrow("KAHIER_API_BASE");
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
        ["getZoneData", () => getZoneData("1", null)],
        ["createTask", () => createTask({} as never, null)],
        ["getEstablishmentUsers", () => getEstablishmentUsers(null)],
        ["createPlanningEvent", () => createPlanningEvent({}, null)],
        ["createPeriodeTab", () => createPeriodeTab({ name: "Tab", zoneId: 1 }, null)],
    ])("rejects a missing API key for %s", async (_name, call) => {
        vi.stubEnv("KAHIER_API_KEY", "");
        vi.stubEnv("KAHIER_API_KEY_FILE", "");
        await expect(call()).rejects.toMatchObject({ status: 400, message: "Clé API Kahier manquante." });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("loads periods and categories by period", async () => {
        fetchMock
            .mockResolvedValueOnce(response([{ id: 1 }, { id: 2 }]))
            .mockResolvedValueOnce(response([{ id: 10, name: "A" }]))
            .mockResolvedValueOnce(response([{ id: 20, name: "B" }]));

        await expect(getZoneData("zone-7", " override ")).resolves.toEqual({
            periodes: [{ id: 1 }, { id: 2 }],
            categoriesByPeriode: { "1": [{ id: 10, name: "A" }], "2": [{ id: 20, name: "B" }] },
        });
        expect(fetchMock.mock.calls[0]?.[0]).toBe(`${baseUrl}/periodes/zone/?zoneId=zone-7`);
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: { "x-api-key": "override" } });
    });

    it("returns an empty category list when one category request fails", async () => {
        fetchMock.mockResolvedValueOnce(response([{ id: 1 }])).mockResolvedValueOnce(response("no", 503));
        await expect(getZoneData("1")).resolves.toEqual({ periodes: [{ id: 1 }], categoriesByPeriode: { "1": [] } });
    });

    it("maps a failed period request to a service error", async () => {
        fail(502);
        await expect(getZoneData("1")).rejects.toMatchObject({ status: 502, message: "Impossible de récupérer les onglets." });
    });

    it("creates a task with JSON headers and payload", async () => {
        fetchMock.mockResolvedValueOnce(response({ id: 9 }));
        const payload = { name: "Task", categoryId: 2, assignedUserIds: [], daysOfWeek: [], displayOrder: 1 };
        await expect(createTask(payload as never, "key")).resolves.toEqual({ id: 9 });
        expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/tasks`, expect.objectContaining({ method: "POST", body: JSON.stringify(payload) }));
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ headers: { "Content-Type": "application/json", "x-api-key": "key" } });
    });

    it("reports task creation failures", async () => {
        fail(400);
        await expect(createTask({} as never)).rejects.toMatchObject({ status: 400, message: "Impossible de créer la tâche." });
    });

    it("gets establishment users", async () => {
        fetchMock.mockResolvedValueOnce(response([{ id: 1, firstname: "Ada" }]));
        await expect(getEstablishmentUsers()).resolves.toEqual([{ id: 1, firstname: "Ada" }]);
        expect(fetchMock.mock.calls[0]?.[0]).toBe(`${baseUrl}/establishments/users`);
    });

    it("reports establishment user failures", async () => {
        fail(401);
        await expect(getEstablishmentUsers()).rejects.toMatchObject({ status: 401 });
    });

    it("gets plannings", async () => {
        fetchMock.mockResolvedValueOnce(response([{ id: 3, name: "Main" }]));
        await expect(getPlannings()).resolves.toEqual([{ id: 3, name: "Main" }]);
    });

    it("reports planning failures", async () => {
        fail(500);
        await expect(getPlannings()).rejects.toMatchObject({ status: 500, message: "Impossible de récupérer les plannings." });
    });

    it("encodes planning legend mode", async () => {
        fetchMock.mockResolvedValueOnce(response([{ id: 1 }]));
        await getPlanningLegends("p-1", "été ouvert");
        expect(fetchMock.mock.calls[0]?.[0]).toBe(`${baseUrl}/plannings/p-1/legends?mode=%C3%A9t%C3%A9%20ouvert`);
    });

    it("gets planning legends", async () => {
        fetchMock.mockResolvedValueOnce(response([{ id: 1, label: "Blue" }]));
        await expect(getPlanningLegends("p", "all")).resolves.toEqual([{ id: 1, label: "Blue" }]);
    });

    it("reports planning legend failures", async () => {
        fail(404);
        await expect(getPlanningLegends("p", "all")).rejects.toMatchObject({ status: 404 });
    });

    it("creates planning events", async () => {
        fetchMock.mockResolvedValueOnce(response({ id: 4 }));
        await expect(createPlanningEvent({ title: "Meeting" })).resolves.toEqual({ id: 4 });
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "POST", body: JSON.stringify({ title: "Meeting" }) });
    });

    it("reports planning event failures", async () => {
        fail(422);
        await expect(createPlanningEvent({})).rejects.toMatchObject({ status: 422 });
    });

    it("creates a planning legend with the default main agenda", async () => {
        fetchMock.mockResolvedValueOnce(response({ id: 8 }));
        await createPlanningLegend({ label: "Congés", color: "#fff", selectedPlanningId: 3 });
        expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
            label: "Congés", color: "#fff", selectedPlanningId: 3, agenda_principal: true,
        });
    });

    it("preserves an explicit secondary agenda flag", async () => {
        fetchMock.mockResolvedValueOnce(response({ id: 8 }));
        await createPlanningLegend({ label: "Other", color: "#000", selectedPlanningId: 3, agenda_principal: false });
        expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string).agenda_principal).toBe(false);
    });

    it("reports legend creation failures", async () => {
        fail(409);
        await expect(createPlanningLegend({ label: "x", color: "#000", selectedPlanningId: 1 })).rejects.toMatchObject({ status: 409 });
    });

    it("gets API key scopes", async () => {
        fetchMock.mockResolvedValueOnce(response({ scopes: [{ id: 1, label: "Read", description: "", scopes: ["read"] }] }));
        await expect(getApiKeyScopes()).resolves.toEqual({ scopes: [{ id: 1, label: "Read", description: "", scopes: ["read"] }] });
        expect(fetchMock.mock.calls[0]?.[0]).toBe(`${baseUrl}/api/establishments/api-keys/scopes`);
    });

    it.each([
        ["{\"error\":\"Denied\"}", "Impossible de récupérer les scopes. Denied"],
        ["{\"message\":\"No access\"}", "Impossible de récupérer les scopes. No access"],
        ["plain upstream error", "Impossible de récupérer les scopes. plain upstream error"],
        ["", "Impossible de récupérer les scopes. Erreur upstream (403)"],
    ])("extracts scope error details", async (body, message) => {
        fail(403, body);
        await expect(getApiKeyScopes()).rejects.toMatchObject({ status: 403, message });
    });

    it("creates a period tab with the upstream field names", async () => {
        fetchMock.mockResolvedValueOnce(response({ id: 3 }));
        await createPeriodeTab({ name: "  2026  ", zoneId: 7 });
        expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({ label: "  2026  ", zoneId: 7, isGeneral: false });
    });

    it("reports period tab errors with upstream details", async () => {
        fail(400, { message: "invalid tab" });
        await expect(createPeriodeTab({ name: "x", zoneId: 1 })).rejects.toMatchObject({ status: 400, message: "Impossible de créer l'onglet. invalid tab" });
    });

    it("creates a category tab", async () => {
        fetchMock.mockResolvedValueOnce(response({ id: 4 }));
        await createCategoryTab({ name: "Urgent", tabId: 3 });
        expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({ name: "Urgent", periodeTabId: 3, displayOrder: 9999, assignedUserIds: [] });
    });

    it("reports category tab errors", async () => {
        fail(409, "duplicate");
        await expect(createCategoryTab({ name: "x", tabId: 1 })).rejects.toMatchObject({ status: 409, message: "Impossible de créer la catégorie. duplicate" });
    });

    it("updates a category link and carries assigned user IDs", async () => {
        fetchMock.mockResolvedValueOnce(response([category({ id: 5, assignedUsers: [{ id: 11 }, { id: 12 }] })]));
        fetchMock.mockResolvedValueOnce(response({ id: 5, crmProjectId: "project-1" }));
        await expect(updateCategoryLink(5, { periodeTabId: 3, crmProjectId: "project-1", crmProjectName: "Project" })).resolves.toEqual({ id: 5, crmProjectId: "project-1" });
        expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string)).toMatchObject({ id: 5, assignedUserIds: [11, 12], crmProjectId: "project-1" });
    });

    it("returns 404 for an unknown category link", async () => {
        fetchMock.mockResolvedValueOnce(response([]));
        await expect(updateCategoryLink(99, { periodeTabId: 3, crmProjectId: null, crmProjectName: null })).rejects.toMatchObject({ status: 404 });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("reports category lookup errors while updating", async () => {
        fail(502, { error: "category service down" });
        await expect(updateCategoryLink(1, { periodeTabId: 3, crmProjectId: null, crmProjectName: null })).rejects.toMatchObject({ status: 502, message: "Impossible de charger la catégorie Kahier. category service down" });
    });

    it("reports category patch errors while updating", async () => {
        fetchMock.mockResolvedValueOnce(response([category({ id: 5 })]));
        fail(500, "patch failed");
        await expect(updateCategoryLink(5, { periodeTabId: 3, crmProjectId: null, crmProjectName: null })).rejects.toMatchObject({ status: 500, message: "Impossible de mettre à jour la catégorie. patch failed" });
    });

    it("sorts category tasks by display order and then name", async () => {
        fetchMock.mockResolvedValueOnce(response([category({ Task: [task({ id: 1, name: "Z", displayOrder: 1 }), task({ id: 2, name: "A", displayOrder: 1 }), task({ id: 3, name: "First", displayOrder: 0 })] })]));
        await expect(getCategoryTasks(2, 3)).resolves.toEqual([expect.objectContaining({ id: 3 }), expect.objectContaining({ id: 2 }), expect.objectContaining({ id: 1 })]);
    });

    it("returns 404 when category tasks have no category", async () => {
        fetchMock.mockResolvedValueOnce(response([category({ id: 1 })]));
        await expect(getCategoryTasks(2, 3)).rejects.toMatchObject({ status: 404, message: "Catégorie introuvable" });
    });

    it("reports category task lookup failures", async () => {
        fail(503, "tasks unavailable");
        await expect(getCategoryTasks(2, 3)).rejects.toMatchObject({ status: 503, message: "Impossible de récupérer les catégories. tasks unavailable" });
    });

    it("does not toggle an already matching task", async () => {
        fetchMock.mockResolvedValueOnce(response([category({ Task: [task({ completed: true })] })]));
        await expect(setTaskCompletion(1, { categoryId: 2, periodeTabId: 3, completed: true })).resolves.toEqual(expect.objectContaining({ id: 1, completed: true }));
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("toggles a task when its completion differs", async () => {
        fetchMock.mockResolvedValueOnce(response([category({ Task: [task({ completed: false })] })]));
        fetchMock.mockResolvedValueOnce(response(task({ completed: true })));
        await expect(setTaskCompletion(1, { categoryId: 2, periodeTabId: 3, completed: true })).resolves.toEqual(expect.objectContaining({ completed: true }));
        expect(fetchMock.mock.calls[1]?.[0]).toBe(`${baseUrl}/tasks/1/toggle`);
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "PATCH" });
    });

    it("returns 404 when the requested task is absent", async () => {
        fetchMock.mockResolvedValueOnce(response([category({ Task: [] })]));
        await expect(setTaskCompletion(1, { categoryId: 2, periodeTabId: 3, completed: true })).rejects.toMatchObject({ status: 404, message: "Tâche introuvable" });
    });

    it("reports task toggle failures with upstream details", async () => {
        fetchMock.mockResolvedValueOnce(response([category({ Task: [task({ completed: false })] })]));
        fail(500, { error: "toggle failed" });
        await expect(setTaskCompletion(1, { categoryId: 2, periodeTabId: 3, completed: true })).rejects.toMatchObject({ status: 500, message: "Impossible de mettre à jour la tâche. toggle failed" });
    });
});
