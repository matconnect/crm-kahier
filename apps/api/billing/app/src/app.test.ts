import { afterEach, describe, expect, it } from "vitest";

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
    for (const server of servers.splice(0)) server.close();
});

async function request(path: string) {
    const { default: app } = await import("./app.js");
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server unavailable");
    return fetch(`http://127.0.0.1:${address.port}${path}`);
}

describe("billing app", () => {
    it("expose la santé du service", async () => {
        const response = await request("/health");
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true, service: "billing-service" });
    });
});
