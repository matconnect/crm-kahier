import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getBrowserApiBase } from "./public-api-base";

describe("getBrowserApiBase", () => {
    const originalNextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;

    beforeEach(() => {
        delete process.env.NEXT_PUBLIC_API_URL;
    });

    afterEach(() => {
        if (originalNextPublicApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
        else process.env.NEXT_PUBLIC_API_URL = originalNextPublicApiUrl;
    });

    it("retourne NEXT_PUBLIC_API_URL sans slash final", () => {
        process.env.NEXT_PUBLIC_API_URL = "https://dev.crm.kahier.com/";

        expect(getBrowserApiBase()).toBe("https://dev.crm.kahier.com");
    });

    it("conserve une URL d'environnement sans slash final", () => {
        process.env.NEXT_PUBLIC_API_URL = "https://crm.kahier.com";

        expect(getBrowserApiBase()).toBe("https://crm.kahier.com");
    });

    it("ignore les espaces autour de l'URL d'environnement", () => {
        process.env.NEXT_PUBLIC_API_URL = "  https://crm.kahier.com/  ";

        expect(getBrowserApiBase()).toBe("https://crm.kahier.com");
    });

    it("retombe sur l'origine du navigateur", () => {
        expect(getBrowserApiBase()).toBe(window.location.origin.replace(/\/$/, ""));
    });
});
