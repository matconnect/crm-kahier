import type { Prisma } from "@kahier/db-crm";
import type { CurrentUser } from "../lib/current-user.js";
import type { QuoteInput, QuoteStatusValue } from "./quotes.domain.js";

export type QuoteActor = Pick<CurrentUser, "id" | "companyId" | "role">;

export type QuoteListParams = {
    q?: string;
    status?: string;
    clientId?: string;
    page: number;
    pageSize: number;
};

export type QuoteMutationInput = QuoteInput;

export type QuoteWithRelations = Prisma.QuoteGetPayload<{
    include: {
        client: {
            select: {
                id: true;
                name: true;
                location: true;
                addressLine1: true;
                addressLine2: true;
                postalCode: true;
                city: true;
                country: true;
                siren: true;
                vatNumber: true;
                primaryEmail: true;
                primaryPhone: true;
            };
        };
        company: {
            select: {
                id: true;
                name: true;
                legalForm: true;
                capitalSocialCents: true;
                siren: true;
                siret: true;
                vatNumber: true;
                rcsCity: true;
                addressLine1: true;
                addressLine2: true;
                postalCode: true;
                city: true;
                country: true;
                contactEmail: true;
                contactPhone: true;
                paymentTerms: true;
                latePenaltyRateBps: true;
                fixedCompensationCents: true;
            };
        };
        createdBy: { select: { id: true; firstName: true; lastName: true; email: true } };
        lines: { orderBy: { position: "asc" } };
    };
}>;

export type SerializedQuote = Omit<QuoteWithRelations, "status"> & {
    status: QuoteStatusValue;
    storedStatus: QuoteStatusValue;
    lines: Array<
        QuoteWithRelations["lines"][number] & {
            quantity: number;
            unitPrice: number;
            vatRate: number;
        }
    >;
};
