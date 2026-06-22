import { describe, expect, it } from "vitest";
import { calculateFormLine, calculateFormTotals, formatQuoteDate, toDateInput } from "./quotes";

describe("quotes helpers", () => {
    it("calcule les totaux de formulaire sans dérive flottante", () => {
        expect(calculateFormLine({ description: "Conseil", quantity: "1.5", unitPrice: "99.90", vatRate: "20" })).toEqual({
            subtotalCents: 14_985,
            vatCents: 2_997,
            totalCents: 17_982,
        });
    });

    it("agrège correctement les totaux multi-lignes", () => {
        expect(
            calculateFormTotals([
                { description: "A", quantity: "2", unitPrice: "125.5", vatRate: "20" },
                { description: "B", quantity: "1", unitPrice: "49.99", vatRate: "10" },
            ]),
        ).toEqual({
            subtotalCents: 30_099,
            vatCents: 5_520,
            totalCents: 35_619,
        });
    });

    it("formate les dates et les convertit pour le formulaire", () => {
        expect(formatQuoteDate("2026-06-22T00:00:00.000Z")).toMatch(/22/);
        expect(toDateInput("2026-06-22T10:30:00.000Z")).toBe("2026-06-22");
        expect(toDateInput(null)).toBe("");
    });
});
