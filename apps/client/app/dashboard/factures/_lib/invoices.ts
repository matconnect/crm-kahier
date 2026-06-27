export const INVOICE_STATUS_OPTIONS = [
    { value: "DRAFT", label: "Brouillon" },
    { value: "SENT", label: "Envoyée" },
    { value: "PAID", label: "Payée" },
    { value: "OVERDUE", label: "En retard" },
    { value: "CANCELLED", label: "Annulée" },
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUS_OPTIONS)[number]["value"];
export type ClientOption = {
    id: string;
    name: string;
    location?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
    siren?: string | null;
    vatNumber?: string | null;
    primaryEmail?: string | null;
    primaryPhone?: string | null;
};

export type InvoiceLine = {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
};

export type Invoice = {
    id: string;
    number: string;
    status: InvoiceStatus;
    storedStatus: InvoiceStatus;
    issueDate: string;
    dueDate: string;
    paidAt: string | null;
    notes: string | null;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
    client: {
        id: string;
        name: string;
        location: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        city: string | null;
        country: string | null;
        siren: string | null;
        vatNumber: string | null;
        primaryEmail: string | null;
        primaryPhone: string | null;
    };
    company: {
        id: string;
        name: string;
        legalForm: string | null;
        capitalSocialCents: number | null;
        siren: string | null;
        siret: string | null;
        vatNumber: string | null;
        rcsCity: string | null;
        addressLine1: string | null;
        addressLine2: string | null;
        postalCode: string | null;
        city: string | null;
        country: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        paymentTerms: string | null;
        latePenaltyRateBps: number | null;
        fixedCompensationCents: number | null;
    };
    lines: InvoiceLine[];
    createdAt: string;
    updatedAt: string;
};

export type InvoiceSummary = {
    total: number;
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
    cancelled: number;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
    paidCents: number;
    outstandingCents: number;
};

export type InvoiceFormLine = {
    description: string;
    quantity: string;
    unitPrice: string;
    vatRate: string;
};

function parseDecimal(value: string): number {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateFormLine(line: InvoiceFormLine) {
    const quantityMilli = Math.round(parseDecimal(line.quantity) * 1_000);
    const unitPriceCents = Math.round(parseDecimal(line.unitPrice) * 100);
    const vatRateBps = Math.round(parseDecimal(line.vatRate) * 100);
    const subtotalCents = Math.round((quantityMilli * unitPriceCents) / 1_000);
    const vatCents = Math.round((subtotalCents * vatRateBps) / 10_000);
    return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}

export function calculateFormTotals(lines: InvoiceFormLine[]) {
    return lines.reduce(
        (totals, line) => {
            const calculated = calculateFormLine(line);
            return {
                subtotalCents: totals.subtotalCents + calculated.subtotalCents,
                vatCents: totals.vatCents + calculated.vatCents,
                totalCents: totals.totalCents + calculated.totalCents,
            };
        },
        { subtotalCents: 0, vatCents: 0, totalCents: 0 },
    );
}

export function formatInvoiceMoney(cents: number): string {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

export function formatInvoiceDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function toDateInput(value: string | null | undefined): string {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
