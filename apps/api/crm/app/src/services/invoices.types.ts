import type { Prisma } from "@kahier/db-crm";
import type { CurrentUser } from "../lib/current-user.js";
import type { InvoiceInput, InvoiceStatusValue } from "./invoices.domain.js";

export type InvoiceActor = Pick<CurrentUser, "id" | "companyId" | "role">;

export type InvoiceListParams = {
    q?: string;
    status?: string;
    clientId?: string;
    page: number;
    pageSize: number;
};

export type InvoiceMutationInput = InvoiceInput;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
    include: {
        client: {
            select: {
                id: true;
                name: true;
                location: true;
                primaryEmail: true;
                primaryPhone: true;
            };
        };
        company: { select: { id: true; name: true } };
        createdBy: { select: { id: true; firstName: true; lastName: true; email: true } };
        lines: { orderBy: { position: "asc" } };
    };
}>;

export type SerializedInvoice = Omit<InvoiceWithRelations, "status"> & {
    status: InvoiceStatusValue;
    storedStatus: InvoiceStatusValue;
    lines: Array<
        InvoiceWithRelations["lines"][number] & {
            quantity: number;
            unitPrice: number;
            vatRate: number;
        }
    >;
};
