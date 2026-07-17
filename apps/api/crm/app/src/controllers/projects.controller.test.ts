import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getCurrentUser: vi.fn(),
    getParamValue: vi.fn(),
    list: vi.fn(),
    summary: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    assertClientBelongsToCompany: vi.fn(),
    assertUserBelongsToCompany: vi.fn(),
    projectFindFirst: vi.fn(),
}));

vi.mock("../lib/current-user.js", () => ({
    getCurrentUser: mocks.getCurrentUser,
    getParamValue: mocks.getParamValue,
}));

vi.mock("../services/projects.service.js", async () => {
    const actual = await vi.importActual<typeof import("../services/projects.service.js")>("../services/projects.service.js");
    return {
        ...actual,
        list: mocks.list,
        summary: mocks.summary,
        create: mocks.create,
        getById: mocks.getById,
        update: mocks.update,
        remove: mocks.remove,
        assertClientBelongsToCompany: mocks.assertClientBelongsToCompany,
        assertUserBelongsToCompany: mocks.assertUserBelongsToCompany,
    };
});

vi.mock("@kahier/db-crm", () => ({
    prisma: {
        project: {
            findFirst: mocks.projectFindFirst,
        },
    },
    ProjectStatus: {
        DRAFT: "DRAFT",
        IN_PROGRESS: "IN_PROGRESS",
        ON_HOLD: "ON_HOLD",
        COMPLETED: "COMPLETED",
    },
    ProjectPriority: {
        LOW: "LOW",
        MEDIUM: "MEDIUM",
        HIGH: "HIGH",
    },
    Prisma: {
        PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
            code: string;
            meta?: Record<string, unknown>;

            constructor(message: string, options: { code: string; meta?: Record<string, unknown> }) {
                super(message);
                this.code = options.code;
                this.meta = options.meta;
            }
        },
        PrismaClientValidationError: class PrismaClientValidationError extends Error {},
    },
}));

import * as controller from "./projects.controller.js";
import { Prisma } from "@kahier/db-crm";

function createResponse() {
    const res: any = {
        statusCode: 200,
        body: undefined as unknown,
        status: vi.fn(function (code: number) {
            res.statusCode = code;
            return res;
        }),
        json: vi.fn(function (payload: unknown) {
            res.body = payload;
            return res;
        }),
        send: vi.fn(function (payload: unknown) {
            res.body = payload;
            return res;
        }),
    };
    return res;
}

describe("projects controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getCurrentUser.mockResolvedValue({
            id: "user-1",
            companyId: "company-1",
            role: "USER",
            subscriptionType: "PRO",
        });
        mocks.getParamValue.mockReturnValue("project-1");
        mocks.projectFindFirst.mockResolvedValue({ id: "project-1" });
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it("returns 401 when no user is available", async () => {
        mocks.getCurrentUser.mockResolvedValue(null);
        const req = { query: {}, body: {} } as never;
        const res = createResponse();

        await controller.list(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(mocks.list).not.toHaveBeenCalled();
    });

    it("filters the list to the assigned user and hides finance fields on starter plans", async () => {
        mocks.getCurrentUser.mockResolvedValue({
            id: "user-1",
            companyId: "company-1",
            role: "USER",
            subscriptionType: "STARTER_FREE",
        });
        mocks.list.mockResolvedValue({
            items: [
                {
                    id: "project-1",
                    name: "Migration CRM",
                    budgetAmount: 1_500,
                    revenueAmount: 2_500,
                    costAmount: 900,
                    invoicedAmount: 1_200,
                    receivedAmount: 600,
                },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
        });
        const req = { query: {}, body: {} } as never;
        const res = createResponse();

        await controller.list(req, res);

        expect(mocks.list).toHaveBeenCalledWith({
            q: "",
            status: undefined,
            priority: undefined,
            clientId: undefined,
            page: 1,
            pageSize: 20,
            companyId: "company-1",
            assignedUserId: "user-1",
        });
        expect(res.json).toHaveBeenCalledWith({
            items: [
                {
                    id: "project-1",
                    name: "Migration CRM",
                    budgetAmount: null,
                    revenueAmount: null,
                    costAmount: null,
                    invoicedAmount: null,
                    receivedAmount: null,
                },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
        });
    });

    it("normalizes project creation payloads before calling the service", async () => {
        mocks.getCurrentUser.mockResolvedValue({
            id: "admin-1",
            companyId: "company-1",
            role: "ADMIN",
            subscriptionType: "PRO",
        });
        mocks.create.mockResolvedValue({ id: "project-1", name: "Migration CRM" });
        const req = {
            body: {
                name: "  Migration CRM  ",
                reference: "  REF-42 ",
                description: "  Nouveau flux  ",
                context: "  Contexte  ",
                goals: "  Objectifs  ",
                deliverables: "  Livrables  ",
                successMetrics: "  KPI  ",
                risks: "  Risques  ",
                notes: "  Notes  ",
                status: "IN_PROGRESS",
                priority: "HIGH",
                progress: "55.7",
                budgetAmount: "1500.2",
                revenueAmount: "3200",
                costAmount: "1100.4",
                invoicedAmount: "600",
                receivedAmount: "400.4",
                billingMode: "  REGIE  ",
                startDate: "2026-06-20",
                endDate: "2026-06-30",
                clientId: "client-1",
                ownerId: "owner-2",
                kahierTabId: "12",
                kahierCategoryId: "34",
                kahierCategoryName: "  Discovery  ",
                kahierTaskCompletionState: {
                    "task-a": true,
                    "task-b": false,
                    "": true,
                    ignored: "yes",
                },
            },
        } as never;
        const res = createResponse();

        await controller.create(req, res);

        expect(mocks.assertClientBelongsToCompany).toHaveBeenCalledWith("client-1", "company-1");
        expect(mocks.assertUserBelongsToCompany).toHaveBeenCalledWith("owner-2", "company-1");
        expect(mocks.create).toHaveBeenCalledWith({
            name: "Migration CRM",
            reference: "REF-42",
            description: "Nouveau flux",
            context: "Contexte",
            goals: "Objectifs",
            deliverables: "Livrables",
            successMetrics: "KPI",
            risks: "Risques",
            notes: "Notes",
            status: "IN_PROGRESS",
            priority: "HIGH",
            progress: 56,
            budgetAmount: 1500,
            revenueAmount: 3200,
            costAmount: 1100,
            invoicedAmount: 600,
            receivedAmount: 400,
            billingMode: "REGIE",
            startDate: new Date("2026-06-20"),
            endDate: new Date("2026-06-30"),
            kahierTabId: 12,
            kahierCategoryId: 34,
            kahierCategoryName: "Discovery",
            kahierTaskCompletionState: JSON.stringify({ "task-a": true, "task-b": false }),
            company: { connect: { id: "company-1" } },
            client: { connect: { id: "client-1" } },
            owner: { connect: { id: "owner-2" } },
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: "project-1", name: "Migration CRM" });
    });

    it("returns a conflict when a Kahier category is already linked on creation", async () => {
        mocks.getCurrentUser.mockResolvedValue({
            id: "admin-1",
            companyId: "company-1",
            role: "ADMIN",
            subscriptionType: "PRO",
        });
        mocks.create.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
                code: "P2002",
                clientVersion: "test",
                meta: { target: ["kahierCategoryId"] },
            }),
        );
        const req = {
            body: {
                name: "Refonte",
                clientId: "client-1",
                ownerId: "owner-2",
                kahierTabId: 244,
                kahierCategoryId: 457,
                kahierCategoryName: "Projet 1",
            },
        } as never;
        const res = createResponse();

        await controller.create(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: "Cette catégorie Kahier est déjà liée à un autre projet" });
    });

    it("rejects invalid progress updates before hitting the service", async () => {
        const req = { body: { progress: "abc" } } as never;
        const res = createResponse();

        await controller.update(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: "Progression invalide" });
        expect(mocks.update).not.toHaveBeenCalled();
    });

    it("serializes kahier state and disconnects relations on admin updates", async () => {
        mocks.getCurrentUser.mockResolvedValue({
            id: "admin-1",
            companyId: "company-1",
            role: "ADMIN",
            subscriptionType: "PRO",
        });
        mocks.update.mockResolvedValue({ id: "project-1", name: "Migration CRM" });
        const req = {
            body: {
                clientId: "",
                ownerId: "",
                kahierTaskCompletionState: {
                    "task-1": true,
                    ignored: "yes",
                },
            },
        } as never;
        const res = createResponse();

        await controller.update(req, res);

        expect(mocks.update).toHaveBeenCalledWith("project-1", "company-1", {
            client: { disconnect: true },
            owner: { disconnect: true },
            kahierTaskCompletionState: JSON.stringify({ "task-1": true }),
        });
        expect(res.json).toHaveBeenCalledWith({ id: "project-1", name: "Migration CRM" });
    });
});
