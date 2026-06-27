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
            company: {
                name: "Kahier Conseil",
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
        expect(pdf.toString("latin1")).toContain("EMIS PAR");
        expect(pdf.toString("latin1")).toContain("DESTINATAIRE");
        expect(pdf.toString("latin1")).not.toContain("Envoyee");
        expect(pdf.toString("latin1")).toContain("TVA FR123456789");
        expect(pdf.length).toBeGreaterThan(1_000);
    });

    it("creates multiple pages when the invoice has many lines", () => {
        const pdf = generateInvoicePdf({
            number: "FAC-2026-0012",
            status: "DRAFT",
            issueDate: new Date("2026-06-22"),
            dueDate: new Date("2026-07-22"),
            paidAt: null,
            notes: null,
            subtotalCents: 110_000,
            vatCents: 22_000,
            totalCents: 132_000,
            company: {
                name: "Kahier Conseil",
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
                location: null,
                addressLine1: null,
                addressLine2: null,
                postalCode: null,
                city: null,
                country: null,
                primaryEmail: null,
                primaryPhone: null,
                vatNumber: null,
                siren: null,
            },
            lines: Array.from({ length: 11 }, (_, index) => ({
                description: `Ligne ${index + 1}`,
                quantityMilli: 1_000,
                unitPriceCents: 10_000,
                vatRateBps: 2_000,
                subtotalCents: 10_000,
                vatCents: 2_000,
                totalCents: 12_000,
            })),
        });

        const text = pdf.toString("latin1");
        expect(text).toContain("1 / 2");
        expect(text).toContain("2 / 2");
    });
});
