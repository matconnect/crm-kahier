import { describe, expect, it } from "vitest";
import { calculateFormLine, calculateFormTotals, formatInvoiceDate, formatInvoiceMoney, toDateInput } from "./invoices";

describe("invoice form calculations", () => {
    it("calculates HT, TVA and TTC exactly like the backend", () => {
        expect(calculateFormLine({ description: "Conseil", quantity: "1,5", unitPrice: "99.90", vatRate: "20" })).toEqual({
            subtotalCents: 14_985,
            vatCents: 2_997,
            totalCents: 17_982,
        });
    });

    it("handles empty or invalid values as zero", () => {
        expect(calculateFormLine({ description: "", quantity: "foo", unitPrice: "", vatRate: "" })).toEqual({
            subtotalCents: 0,
            vatCents: 0,
            totalCents: 0,
        });
    });

    it("sums all lines", () => {
        expect(
            calculateFormTotals([
                { description: "A", quantity: "2", unitPrice: "100", vatRate: "20" },
                { description: "B", quantity: "1", unitPrice: "50", vatRate: "10" },
            ]),
        ).toEqual({ subtotalCents: 25_000, vatCents: 4_500, totalCents: 29_500 });
    });

    it("formats invoice money in French euros", () => {
        expect(formatInvoiceMoney(12_345).replace(/\u00A0/g, " ")).toBe("123,45 €");
    });

    it("formats and normalizes invoice dates", () => {
        expect(formatInvoiceDate("2026-06-22T00:00:00.000Z")).toMatch(/22 juin 2026|22 juin 2026/i);
        expect(formatInvoiceDate("not-a-date")).toBe("—");
        expect(toDateInput("2026-06-22T00:00:00.000Z")).toBe("2026-06-22");
        expect(toDateInput(null)).toBe("");
    });
});
