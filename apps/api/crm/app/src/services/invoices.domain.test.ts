import { describe, expect, it } from "vitest";
import {
    calculateInvoiceTotals,
    formatInvoiceNumber,
    getEffectiveInvoiceStatus,
    isInvoiceStatusTransitionAllowed,
    validateInvoiceInput,
} from "./invoices.domain.js";

describe("invoice calculations", () => {
    it("calculates HT, TVA and TTC in integer cents", () => {
        const totals = calculateInvoiceTotals([
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
        const totals = calculateInvoiceTotals([
            { description: "Prestation", quantity: "1.5", unitPrice: "99.90", vatRate: "20" },
        ]);

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

describe("invoice validation", () => {
    it("rejects an empty invoice and an invalid due date", () => {
        const result = validateInvoiceInput({
            clientId: "",
            issueDate: "2026-06-22",
            dueDate: "2026-06-21",
            lines: [],
        });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: "clientId" }),
                    expect.objectContaining({ field: "dueDate" }),
                    expect.objectContaining({ field: "lines" }),
                ]),
            );
        }
    });

    it("rejects negative prices, invalid VAT and blank descriptions", () => {
        const result = validateInvoiceInput({
            clientId: "client-1",
            issueDate: "2026-06-22",
            dueDate: "2026-07-22",
            lines: [{ description: " ", quantity: 0, unitPrice: -1, vatRate: 101 }],
        });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.errors).toHaveLength(4);
    });
});

describe("invoice numbering", () => {
    it("formats a stable yearly number", () => {
        expect(formatInvoiceNumber(2026, 1)).toBe("FAC-2026-0001");
        expect(formatInvoiceNumber(2026, 12_345)).toBe("FAC-2026-12345");
    });
});

describe("invoice statuses", () => {
    it("enforces allowed transitions", () => {
        expect(isInvoiceStatusTransitionAllowed("DRAFT", "SENT")).toBe(true);
        expect(isInvoiceStatusTransitionAllowed("SENT", "PAID")).toBe(true);
        expect(isInvoiceStatusTransitionAllowed("PAID", "DRAFT")).toBe(false);
        expect(isInvoiceStatusTransitionAllowed("CANCELLED", "SENT")).toBe(false);
    });

    it("marks a sent invoice overdue after its due date", () => {
        expect(getEffectiveInvoiceStatus("SENT", new Date("2026-06-20"), new Date("2026-06-22"))).toBe("OVERDUE");
        expect(getEffectiveInvoiceStatus("PAID", new Date("2026-06-20"), new Date("2026-06-22"))).toBe("PAID");
    });
});
