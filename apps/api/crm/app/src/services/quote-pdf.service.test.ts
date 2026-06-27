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
            company: {
                name: "Kahier",
                legalForm: "SAS",
                capitalSocialCents: 100_000,
                siren: "123456789",
                siret: "12345678900011",
                vatNumber: "FR123456789",
                rcsCity: "Paris",
                addressLine1: "1 rue de Paris",
                addressLine2: null,
                postalCode: "75001",
                city: "Paris",
                country: "France",
                contactEmail: "hello@kahier.fr",
                contactPhone: "0102030405",
                paymentTerms: "30 jours",
                latePenaltyRateBps: 375,
                fixedCompensationCents: 4000,
            },
            client: {
                name: "Acme",
                location: "Paris",
                addressLine1: "10 rue du Client",
                addressLine2: null,
                postalCode: "75002",
                city: "Paris",
                country: "France",
                primaryEmail: "contact@acme.test",
                primaryPhone: null,
                vatNumber: "FR123456789",
                siren: null,
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
        expect(pdf.toString("latin1")).toContain("EMIS PAR");
        expect(pdf.toString("latin1")).toContain("DESTINATAIRE");
        expect(pdf.toString("latin1")).toContain("Kahier");
        expect(pdf.toString("latin1")).toContain("Acme");
        expect(pdf.toString("latin1")).toContain("Bon pour accord");
        expect(pdf.toString("latin1")).not.toContain("Signature et cachet");
        expect(pdf.toString("latin1")).not.toContain("Zone de signature");
        expect(pdf.toString("latin1")).toContain("TVA FR123456789");
    });
});
