import { describe, expect, it } from "vitest";
import { generateInvoicePdf } from "./invoice-pdf.service.js";

describe("invoice PDF", () => {
    it("generates a readable PDF document", () => {
        const pdf = generateInvoicePdf({
            number: "FAC-2026-0001",
            status: "SENT",
            issueDate: new Date("2026-06-22"),
            dueDate: new Date("2026-07-22"),
            paidAt: null,
            notes: "Merci pour votre confiance.",
            subtotalCents: 10_000,
            vatCents: 2_000,
            totalCents: 12_000,
            company: { name: "Kahier Conseil" },
            client: { name: "Acme", location: "Paris", primaryEmail: "contact@acme.test", primaryPhone: null },
            lines: [
                {
                    description: "Conseil",
                    quantityMilli: 1_000,
                    unitPriceCents: 10_000,
                    vatRateBps: 2_000,
                    subtotalCents: 10_000,
                    vatCents: 2_000,
                    totalCents: 12_000,
                },
            ],
        });

        expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
        expect(pdf.toString("latin1")).toContain("FAC-2026-0001");
        expect(pdf.length).toBeGreaterThan(1_000);
    });
});
