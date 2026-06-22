import { describe, expect, it } from "vitest";
import {
    calculateQuoteTotals,
    formatQuoteNumber,
    getEffectiveQuoteStatus,
    isQuoteStatusTransitionAllowed,
    validateQuoteInput,
} from "./quotes.domain.js";

describe("quote calculations", () => {
    it("calculates HT, TVA and TTC in integer cents", () => {
        const totals = calculateQuoteTotals([
            { description: "Conseil", quantity: 2, unitPrice: 125.5, vatRate: 20 },
            { description: "Licence", quantity: 1, unitPrice: 49.99, vatRate: 10 },
        ]);

        expect(totals.lines).toEqual([
            expect.objectContaining({ subtotalCents: 25_100, vatCents: 5_020, totalCents: 30_120 }),
            expect.objectContaining({ subtotalCents: 4_999, vatCents: 500, totalCents: 5_499 }),
        ]);
        expect(totals.subtotalCents).toBe(30_099);
        expect(totals.vatCents).toBe(5_520);
        expect(totals.totalCents).toBe(35_619);
    });

    it("supports decimal quantities without floating point drift", () => {
        const totals = calculateQuoteTotals([{ description: "Prestation", quantity: "1.5", unitPrice: "99.90", vatRate: "20" }]);

        expect(totals.lines[0]).toEqual(
            expect.objectContaining({
                quantityMilli: 1_500,
                unitPriceCents: 9_990,
                subtotalCents: 14_985,
                vatCents: 2_997,
                totalCents: 17_982,
            }),
        );
    });
});

describe("quote validation", () => {
    it("rejects an empty quote and an invalid expiry date", () => {
        const result = validateQuoteInput({
            clientId: "",
            issueDate: "2026-06-22",
            expiryDate: "2026-06-21",
            lines: [],
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: "clientId" }),
                    expect.objectContaining({ field: "expiryDate" }),
                    expect.objectContaining({ field: "lines" }),
                ]),
            );
        }
    });

    it("rejects negative prices, invalid VAT and blank descriptions", () => {
        const result = validateQuoteInput({
            clientId: "client-1",
            issueDate: "2026-06-22",
            expiryDate: "2026-07-22",
            lines: [{ description: " ", quantity: 0, unitPrice: -1, vatRate: 101 }],
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.errors).toHaveLength(4);
    });
});

describe("quote numbering", () => {
    it("formats a stable yearly number", () => {
        expect(formatQuoteNumber(2026, 1)).toBe("DEV-2026-0001");
        expect(formatQuoteNumber(2026, 12_345)).toBe("DEV-2026-12345");
    });

    it("keeps leading zeroes for small sequence numbers", () => {
        expect(formatQuoteNumber(2027, 9)).toBe("DEV-2027-0009");
    });
});

describe("quote statuses", () => {
    it("enforces allowed transitions", () => {
        expect(isQuoteStatusTransitionAllowed("DRAFT", "SENT")).toBe(true);
        expect(isQuoteStatusTransitionAllowed("SENT", "ACCEPTED")).toBe(true);
        expect(isQuoteStatusTransitionAllowed("ACCEPTED", "DRAFT")).toBe(false);
        expect(isQuoteStatusTransitionAllowed("CANCELLED", "SENT")).toBe(true);
    });

    it("marks a sent quote expired after its validity date", () => {
        expect(getEffectiveQuoteStatus("SENT", new Date("2026-06-20"), new Date("2026-06-22"))).toBe("EXPIRED");
        expect(getEffectiveQuoteStatus("ACCEPTED", new Date("2026-06-20"), new Date("2026-06-22"))).toBe("ACCEPTED");
    });

    it("keeps draft and cancelled quotes untouched", () => {
        expect(getEffectiveQuoteStatus("DRAFT", new Date("2026-06-20"), new Date("2026-06-22"))).toBe("DRAFT");
        expect(getEffectiveQuoteStatus("CANCELLED", new Date("2026-06-20"), new Date("2026-06-22"))).toBe("CANCELLED");
    });

    it("accepts the full expired transition path", () => {
        expect(isQuoteStatusTransitionAllowed("SENT", "EXPIRED")).toBe(true);
        expect(isQuoteStatusTransitionAllowed("EXPIRED", "ACCEPTED")).toBe(true);
        expect(isQuoteStatusTransitionAllowed("EXPIRED", "SENT")).toBe(true);
    });

    it("allows edits among non-draft quote statuses", () => {
        expect(isQuoteStatusTransitionAllowed("REJECTED", "SENT")).toBe(true);
        expect(isQuoteStatusTransitionAllowed("CANCELLED", "ACCEPTED")).toBe(true);
    });
});
