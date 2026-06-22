import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getServerApiBase } from "./api-base";

describe("getServerApiBase", () => {
    const originalApiInternalUrl = process.env.API_INTERNAL_URL;
    const originalNextPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;

    beforeEach(() => {
        delete process.env.API_INTERNAL_URL;
        delete process.env.NEXT_PUBLIC_API_URL;
    });

    afterEach(() => {
        if (originalApiInternalUrl === undefined) delete process.env.API_INTERNAL_URL;
        else process.env.API_INTERNAL_URL = originalApiInternalUrl;

        if (originalNextPublicApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
        else process.env.NEXT_PUBLIC_API_URL = originalNextPublicApiUrl;
    });

    it("privilégie API_INTERNAL_URL", () => {
        process.env.API_INTERNAL_URL = "http://gateway:3011";
        process.env.NEXT_PUBLIC_API_URL = "https://crm.kahier.com";

        expect(getServerApiBase()).toBe("http://gateway:3011");
    });

    it("utilise NEXT_PUBLIC_API_URL si API_INTERNAL_URL est absent", () => {
        process.env.NEXT_PUBLIC_API_URL = "https://crm.kahier.com";

        expect(getServerApiBase()).toBe("https://crm.kahier.com");
    });

    it("retourne null si aucune URL n'est configurée", () => {
        expect(getServerApiBase()).toBe(null);
    });
});
