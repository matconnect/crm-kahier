import { describe, expect, it } from "vitest";
import { calculateFormLine, calculateFormTotals } from "./invoices";

describe("invoice form calculations", () => {
    it("calculates HT, TVA and TTC exactly like the backend", () => {
        expect(calculateFormLine({ description: "Conseil", quantity: "1,5", unitPrice: "99.90", vatRate: "20" })).toEqual({
            subtotalCents: 14_985,
            vatCents: 2_997,
            totalCents: 17_982,
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
});
