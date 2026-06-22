import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    getCurrentUser: vi.fn(),
    getParamValue: vi.fn(),
    list: vi.fn(),
    summary: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
    validate: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
    generateInvoicePdf: vi.fn(),
}));

vi.mock("../lib/current-user.js", () => ({
    getCurrentUser: mocks.getCurrentUser,
    getParamValue: mocks.getParamValue,
}));

vi.mock("../services/invoices.service.js", async () => {
    const actual = await vi.importActual<typeof import("../services/invoices.service.js")>(
        "../services/invoices.service.js",
    );
    return {
        ...actual,
        list: mocks.list,
        summary: mocks.summary,
        create: mocks.create,
        getById: mocks.getById,
        update: mocks.update,
        validate: mocks.validate,
        updateStatus: mocks.updateStatus,
        remove: mocks.remove,
    };
});

vi.mock("../services/invoice-pdf.service.js", () => ({
    generateInvoicePdf: mocks.generateInvoicePdf,
}));

import * as controller from "./invoices.controller.js";

function createResponse() {
    const res: any = {
        statusCode: 200,
        headers: {} as Record<string, string>,
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
        setHeader: vi.fn(function (name: string, value: string) {
            res.headers[name.toLowerCase()] = value;
            return res;
        }),
    };
    return res;
}

const currentUser = {
    id: "user-1",
    companyId: "company-1",
    role: "USER",
    subscriptionType: "PRO",
};

describe("invoices controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.getCurrentUser.mockResolvedValue(currentUser);
        mocks.getParamValue.mockReturnValue("invoice-1");
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

    it("creates an invoice and returns 201", async () => {
        const req = { query: {}, body: { clientId: "client-1" } } as never;
        const res = createResponse();
        mocks.create.mockResolvedValue({ id: "invoice-1", number: "FAC-2026-0001" });

        await controller.create(req, res);

        expect(mocks.create).toHaveBeenCalledWith(currentUser, { clientId: "client-1" });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({ id: "invoice-1", number: "FAC-2026-0001" });
    });

    it("updates the status with the payload value", async () => {
        const req = { body: { status: "PAID", paidAt: "2026-06-22" } } as never;
        const res = createResponse();
        mocks.updateStatus.mockResolvedValue({ id: "invoice-1", status: "PAID" });

        await controller.updateStatus(req, res);

        expect(mocks.updateStatus).toHaveBeenCalledWith("invoice-1", currentUser, "PAID", "2026-06-22");
        expect(res.json).toHaveBeenCalledWith({ id: "invoice-1", status: "PAID" });
    });

    it("returns the generated PDF with headers", async () => {
        const req = { query: {}, body: {} } as never;
        const res = createResponse();
        mocks.getById.mockResolvedValue({ number: "FAC-2026-0001" });
        mocks.generateInvoicePdf.mockReturnValue(Buffer.from("pdf"));

        await controller.downloadPdf(req, res);

        expect(mocks.getById).toHaveBeenCalledWith("invoice-1", currentUser);
        expect(res.setHeader).toHaveBeenCalledWith("content-type", "application/pdf");
        expect(res.setHeader).toHaveBeenCalledWith("content-disposition", 'attachment; filename="FAC-2026-0001.pdf"');
        expect(res.send).toHaveBeenCalledWith(Buffer.from("pdf"));
    });
});
