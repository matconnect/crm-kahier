import { describe, expect, it } from "vitest";
import { generateQuotePdf } from "./quote-pdf.service.js";

describe("generateQuotePdf", () => {
    it("builds a valid PDF buffer for a quote", () => {
        const pdf = generateQuotePdf({
            number: "DEV-2026-0001",
            status: "SENT",
            issueDate: new Date("2026-06-22T00:00:00.000Z"),
            expiryDate: new Date("2026-07-22T00:00:00.000Z"),
            acceptedAt: null,
            notes: "Validité 30 jours",
            subtotalCents: 30_099,
            vatCents: 5_520,
            totalCents: 35_619,
            company: { name: "Kahier" },
            client: {
                name: "Acme",
                location: "Paris",
                primaryEmail: "contact@acme.test",
                primaryPhone: null,
                vatNumber: "FR123456789",
            },
            lines: [
                {
                    description: "Conseil stratégique",
                    quantityMilli: 2_000,
                    unitPriceCents: 12_550,
                    vatRateBps: 2_000,
                    subtotalCents: 25_100,
                    vatCents: 5_020,
                    totalCents: 30_120,
                },
            ],
        });

        expect(pdf.subarray(0, 8).toString("latin1")).toContain("%PDF-1.4");
        expect(pdf.toString("latin1")).toContain("DEV-2026-0001");
        expect(pdf.toString("latin1")).toContain("DEVIS");
        expect(pdf.toString("latin1")).toContain("Bon pour accord");
        expect(pdf.toString("latin1")).not.toContain("Signature et cachet");
        expect(pdf.toString("latin1")).not.toContain("Zone de signature");
        expect(pdf.toString("latin1")).toContain("TVA FR123456789");
    });
});
