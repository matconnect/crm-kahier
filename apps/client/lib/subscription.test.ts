import { describe, expect, it } from "vitest";

import { hasBillingFeature, normalizeSubscriptionType, type BillingFeature } from "./subscription";

describe("subscription", () => {
    it.each([
        "STARTER_FREE",
        "PRO_MONTHLY",
        "PRO_YEARLY",
        "ENTERPRISE_MONTHLY",
        "ENTERPRISE_YEARLY",
    ] as const)("conserve le type d'abonnement valide %s", (subscriptionType) => {
        expect(normalizeSubscriptionType(subscriptionType)).toBe(subscriptionType);
    });

    it.each([null, undefined, "", "starter_free", "TRIAL", "PRO"])("normalise %s vers STARTER_FREE", (value) => {
        expect(normalizeSubscriptionType(value)).toBe("STARTER_FREE");
    });

    it.each([
        ["PRO_MONTHLY", "finance_dashboard"],
        ["PRO_MONTHLY", "quotes_module"],
        ["PRO_MONTHLY", "invoices_module"],
        ["PRO_YEARLY", "finance_dashboard"],
        ["PRO_YEARLY", "quotes_module"],
        ["PRO_YEARLY", "invoices_module"],
        ["ENTERPRISE_MONTHLY", "finance_dashboard"],
        ["ENTERPRISE_MONTHLY", "quotes_module"],
        ["ENTERPRISE_MONTHLY", "invoices_module"],
        ["ENTERPRISE_YEARLY", "finance_dashboard"],
        ["ENTERPRISE_YEARLY", "quotes_module"],
        ["ENTERPRISE_YEARLY", "invoices_module"],
    ] as const)("autorise %s à accéder à %s", (subscriptionType, feature) => {
        expect(hasBillingFeature(subscriptionType, feature)).toBe(true);
    });

    it.each([
        ["STARTER_FREE", "finance_dashboard"],
        ["STARTER_FREE", "quotes_module"],
        ["STARTER_FREE", "invoices_module"],
        [null, "finance_dashboard"],
        [undefined, "quotes_module"],
        ["UNKNOWN", "invoices_module"],
    ] as [string | null | undefined, BillingFeature][])("refuse %s pour %s", (subscriptionType, feature) => {
        expect(hasBillingFeature(subscriptionType, feature)).toBe(false);
    });
});
