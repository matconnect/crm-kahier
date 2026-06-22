import express, { type RequestHandler } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createQuotesRouter } from "./quotes.route.js";

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
    for (const server of servers.splice(0)) server.close();
});

async function request(router: ReturnType<typeof createQuotesRouter>, path: string, init?: RequestInit) {
    const app = express();
    app.use(express.json());
    app.use("/quotes", router);
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server unavailable");
    return fetch(`http://127.0.0.1:${address.port}${path}`, init);
}

function handler(status: number): RequestHandler {
    return (_req, res) => {
        res.status(status).json({ ok: true });
    };
}

describe("quote routes", () => {
    it("exposes CRUD and PDF endpoints", async () => {
        const deps = {
            list: vi.fn(handler(200)),
            summary: vi.fn(handler(200)),
            create: vi.fn(handler(201)),
            getById: vi.fn(handler(200)),
            update: vi.fn(handler(200)),
            validate: vi.fn(handler(200)),
            updateStatus: vi.fn(handler(200)),
            remove: vi.fn(handler(204)),
            downloadPdf: vi.fn(handler(200)),
        };
        const router = createQuotesRouter(deps);

        expect((await request(router, "/quotes")).status).toBe(200);
        expect((await request(router, "/quotes/summary")).status).toBe(200);
        expect((await request(router, "/quotes", { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(201);
        expect((await request(router, "/quotes/qt-1")).status).toBe(200);
        expect((await request(router, "/quotes/qt-1", { method: "PATCH", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
        expect((await request(router, "/quotes/qt-1/validate", { method: "POST" })).status).toBe(200);
        expect((await request(router, "/quotes/qt-1/status", { method: "PATCH", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(200);
        expect((await request(router, "/quotes/qt-1", { method: "DELETE" })).status).toBe(204);
        expect((await request(router, "/quotes/qt-1/pdf")).status).toBe(200);
    });
});
