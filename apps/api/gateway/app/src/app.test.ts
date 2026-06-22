import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
    for (const server of servers.splice(0)) server.close();
    vi.unstubAllEnvs();
    vi.resetModules();
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

describe("gateway app", () => {
    beforeEach(() => {
        vi.stubEnv("CRM_SERVICE_URL", "http://crm.local");
        vi.stubEnv("COMPANY_SERVICE_URL", "http://company.local");
        vi.stubEnv("KAHIER_SERVICE_URL", "http://kahier.local");
        vi.stubEnv("BILLING_SERVICE_URL", "http://billing.local");
        vi.stubEnv("NODE_ENV", "test");
    });

    it("expose la santé et les upstreams configurés", async () => {
        const response = await request("/health");
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({
            ok: true,
            service: "api-gateway",
            upstreams: {
                crmServiceUrl: "http://crm.local",
                companyServiceUrl: "http://company.local",
                kahierServiceUrl: "http://kahier.local",
                billingServiceUrl: "http://billing.local",
            },
        });
    });
});
