import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateCompanyCode, resolveSubscriptionType, slugify } from "../lib/company.js";
import { getEnvOrFile, resolvePublicAppUrl, splitUrls } from "../lib/env.js";
import { fromUnix, getStripe, getStripeWebhookSecret, resolveStripePriceId } from "./stripe.service.js";

afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

beforeEach(() => {
    for (const name of [
        "TEST_VALUE_FILE",
        "APP_PUBLIC_URL_FILE",
        "STRIPE_SECRET_KEY_FILE",
        "STRIPE_WEBHOOK_SECRET_FILE",
        "STRIPE_PRICE_STARTER_FILE",
        "STRIPE_PRICE_PRO_FILE",
        "STRIPE_PRICE_ENTERPRISE_FILE",
        "STRIPE_PRICE_STARTER_YEARLY_FILE",
        "STRIPE_PRICE_PRO_YEARLY_FILE",
        "STRIPE_PRICE_ENTERPRISE_YEARLY_FILE",
    ]) {
        vi.stubEnv(name, "");
    }
});

describe("billing configuration and Stripe helpers", () => {
    it.each([
        ["Kahier Conseil", "kahier-conseil"],
        ["  Société Démo  ", "societe-demo"],
        ["Crème & café", "creme-cafe"],
        ["A/B testing", "a-b-testing"],
        ["déjà vu", "deja-vu"],
        ["---Acme---", "acme"],
        ["hello_world", "hello-world"],
        ["123 Entreprise", "123-entreprise"],
    ])("slugifies %s", (input, expected) => expect(slugify(input)).toBe(expected));

    it.each([
        ["starter", undefined, "STARTER_FREE"],
        ["pro", "monthly", "PRO_MONTHLY"],
        ["pro", "yearly", "PRO_YEARLY"],
        ["enterprise", "monthly", "ENTERPRISE_MONTHLY"],
        ["enterprise", "yearly", "ENTERPRISE_YEARLY"],
        ["unknown", "yearly", "STARTER_FREE"],
        [null, "monthly", "STARTER_FREE"],
        ["starter", "yearly", "STARTER_FREE"],
    ])("resolves plan %s/%s", (plan, cycle, expected) => expect(resolveSubscriptionType(plan, cycle)).toBe(expected));

    it.each([
        ["", []],
        ["http://a.test", ["http://a.test"]],
        ["http://a.test/, https://b.test/", ["http://a.test", "https://b.test"]],
        [" a , , b ", ["a", "b"]],
        ["///", ["//"]],
        [undefined, []],
        ["one,two,three", ["one", "two", "three"]],
        ["http://localhost:3000/", ["http://localhost:3000"]],
    ])("splits URL list %s", (input, expected) => expect(splitUrls(input)).toEqual(expected));

    it.each([
        [null, null],
        ["", null],
        ["   ", null],
        ["direct", "direct"],
        [" direct ", "direct"],
    ])("reads environment values", (value, expected) => {
        vi.stubEnv("TEST_VALUE", value ?? "");
        expect(getEnvOrFile("TEST_VALUE")).toBe(expected);
    });

    it.each([
        ["starter", "monthly", "price_starter"],
        ["pro", "monthly", "price_pro"],
        ["enterprise", "monthly", "price_enterprise"],
        ["starter", "yearly", "price_starter_yearly"],
        ["pro", "yearly", "price_pro_yearly"],
        ["enterprise", "yearly", "price_enterprise_yearly"],
        ["missing", "monthly", null],
        ["pro", "monthly", null],
    ])("resolves Stripe price %s/%s", (plan, cycle, expected) => {
        vi.stubEnv("STRIPE_PRICE_STARTER", " price_starter ");
        vi.stubEnv("STRIPE_PRICE_PRO", "price_pro");
        vi.stubEnv("STRIPE_PRICE_ENTERPRISE", "price_enterprise");
        vi.stubEnv("STRIPE_PRICE_STARTER_YEARLY", "price_starter_yearly");
        vi.stubEnv("STRIPE_PRICE_PRO_YEARLY", "price_pro_yearly");
        vi.stubEnv("STRIPE_PRICE_ENTERPRISE_YEARLY", "price_enterprise_yearly");
        const typedCycle = cycle as "monthly" | "yearly";
        if (plan === "missing") expect(resolveStripePriceId(plan, typedCycle)).toBeNull();
        else if (plan === "pro" && cycle === "monthly" && expected === null) {
            vi.stubEnv("STRIPE_PRICE_PRO", "");
            expect(resolveStripePriceId(plan, typedCycle)).toBeNull();
        } else expect(resolveStripePriceId(plan, typedCycle)).toBe(expected);
    });

    it.each([
        [undefined, null],
        [null, null],
        [0, null],
        [Number.NaN, null],
        [Number.POSITIVE_INFINITY, null],
        [1, new Date(1000)],
        [1_700_000_000, new Date(1_700_000_000_000)],
        [-1, new Date(-1000)],
    ])("converts Unix timestamp %s", (seconds, expected) => {
        const result = fromUnix(seconds);
        if (expected === null) expect(result).toBeNull();
        else expect(result).toEqual(expected);
    });

    it.each([
        [{ APP_PUBLIC_URL: "https://app.test/", URL_PROD: "https://prod.test/", URL_DEV: "https://dev.test/" }, "https://app.test"],
        [{ APP_PUBLIC_URL: "", URL_PROD: "https://prod.test/", URL_DEV: "" }, "https://prod.test"],
        [{ APP_PUBLIC_URL: "", URL_PROD: "", URL_DEV: "https://dev.test/" }, "https://dev.test"],
        [{ APP_PUBLIC_URL: "", URL_PROD: "", URL_DEV: "" }, null],
    ])("resolves public app URL", (env, expected) => {
        for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
        expect(resolvePublicAppUrl()).toBe(expected);
    });

    it("returns no Stripe client without a secret", () => {
        vi.stubEnv("STRIPE_SECRET_KEY", "");
        expect(getStripe()).toBeNull();
    });

    it("returns no webhook secret when it is absent", () => {
        vi.stubEnv("STRIPE_WEBHOOK_SECRET", "");
        expect(getStripeWebhookSecret()).toBeNull();
    });

    it("generates a formatted company code", () => {
        vi.spyOn(Math, "random").mockReturnValue(0.123456);
        expect(generateCompanyCode()).toMatch(/^cmp_[A-Z0-9]{6}$/);
        vi.restoreAllMocks();
    });
});
