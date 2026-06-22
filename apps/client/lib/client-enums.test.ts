import { describe, expect, it } from "vitest";

import {
    CLIENT_REVENUE_SOURCE_OPTIONS,
    CLIENT_SEGMENT_OPTIONS,
    CLIENT_STATUS_OPTIONS,
    getRevenueSourceLabel,
    type RevenueSource,
} from "./client-enums";

describe("client-enums", () => {
    it.each([
        ["PROSPECT", "Prospect"],
        ["ACTIVE", "Client actif"],
        ["INACTIVE", "Client inactif"],
    ])("expose le statut %s avec le libellé %s", (value, label) => {
        expect(CLIENT_STATUS_OPTIONS).toContainEqual({ value, label });
    });

    it.each([
        ["TPE", "TPE"],
        ["PME", "PME"],
        ["ETI", "ETI"],
        ["GE", "Grand compte"],
        ["OTHER", "Autre"],
    ])("expose le segment %s avec le libellé %s", (value, label) => {
        expect(CLIENT_SEGMENT_OPTIONS).toContainEqual({ value, label });
    });

    it.each([
        ["REFERRAL", "Recommandation"],
        ["OUTBOUND", "Prospection"],
        ["ADS", "Publicité"],
        ["PARTNER", "Partenaire"],
        ["UPSELL", "Upsell"],
        ["OTHER", "Autre"],
    ])("expose la source de revenu %s avec le libellé %s", (value, label) => {
        expect(CLIENT_REVENUE_SOURCE_OPTIONS).toContainEqual({ value, label });
    });

    it.each([
        ["REFERRAL", "Recommandation"],
        ["OUTBOUND", "Prospection"],
        ["ADS", "Publicité"],
        ["PARTNER", "Partenaire"],
        ["UPSELL", "Upsell"],
        ["OTHER", "Autre"],
    ] as const)("résout le libellé de source %s", (value, label) => {
        expect(getRevenueSourceLabel(value)).toBe(label);
    });

    it.each([null, undefined, "UNKNOWN" as RevenueSource])("retourne un libellé de repli pour %s", (value) => {
        expect(getRevenueSourceLabel(value)).toBe("Non renseignée");
    });
});
