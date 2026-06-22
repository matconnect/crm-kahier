export const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const;
export type InvoiceStatusValue = (typeof INVOICE_STATUSES)[number];

export type InvoiceLineInput = {
    description?: unknown;
    quantity?: unknown;
    unitPrice?: unknown;
    vatRate?: unknown;
};

export type InvoiceInput = {
    clientId?: unknown;
    status?: unknown;
    issueDate?: unknown;
    dueDate?: unknown;
    paidAt?: unknown;
    notes?: unknown;
    lines?: unknown;
};

export type InvoiceValidationError = {
    field: string;
    message: string;
};

export type CalculatedInvoiceLine = {
    description: string;
    quantityMilli: number;
    unitPriceCents: number;
    vatRateBps: number;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
};

export type ValidatedInvoiceInput = {
    clientId: string;
    status: InvoiceStatusValue;
    issueDate: Date;
    dueDate: Date;
    paidAt: Date | null;
    notes: string | null;
    lines: CalculatedInvoiceLine[];
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
};

const STATUS_TRANSITIONS: Record<InvoiceStatusValue, readonly InvoiceStatusValue[]> = {
    DRAFT: ["DRAFT", "SENT", "CANCELLED"],
    SENT: ["SENT", "PAID", "OVERDUE", "CANCELLED"],
    OVERDUE: ["SENT", "PAID", "OVERDUE", "CANCELLED"],
    PAID: ["SENT", "PAID", "OVERDUE", "CANCELLED"],
    CANCELLED: ["SENT", "PAID", "OVERDUE", "CANCELLED"],
};

function parseScaledInteger(value: unknown, scale: number): number | null {
    if (typeof value === "number") {
        if (!Number.isFinite(value)) return null;
        return Math.round(value * scale);
    }
    if (typeof value !== "string") return null;
    const normalized = value.trim().replace(",", ".");
    if (!normalized || !/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.round(parsed * scale) : null;
}

function parseDate(value: unknown): Date | null {
    if (typeof value !== "string" && !(value instanceof Date)) return null;
    const date = value instanceof Date ? new Date(value) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function isInvoiceStatus(value: unknown): value is InvoiceStatusValue {
    return typeof value === "string" && INVOICE_STATUSES.includes(value as InvoiceStatusValue);
}

export function formatInvoiceNumber(year: number, sequence: number): string {
    return `FAC-${year}-${String(sequence).padStart(4, "0")}`;
}

export function isInvoiceStatusTransitionAllowed(
    currentStatus: InvoiceStatusValue,
    nextStatus: InvoiceStatusValue,
): boolean {
    return STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function getEffectiveInvoiceStatus(
    status: InvoiceStatusValue,
    dueDate: Date,
    now = new Date(),
): InvoiceStatusValue {
    if (status === "SENT" && dueDate.getTime() < now.getTime()) return "OVERDUE";
    return status;
}

export function calculateInvoiceTotals(lines: InvoiceLineInput[]) {
    const calculatedLines: CalculatedInvoiceLine[] = lines.map((line) => {
        const description = typeof line.description === "string" ? line.description.trim() : "";
        const quantityMilli = parseScaledInteger(line.quantity, 1_000) ?? 0;
        const unitPriceCents = parseScaledInteger(line.unitPrice, 100) ?? 0;
        const vatRateBps = parseScaledInteger(line.vatRate, 100) ?? 0;
        const subtotalCents = Math.round((quantityMilli * unitPriceCents) / 1_000);
        const vatCents = Math.round((subtotalCents * vatRateBps) / 10_000);

        return {
            description,
            quantityMilli,
            unitPriceCents,
            vatRateBps,
            subtotalCents,
            vatCents,
            totalCents: subtotalCents + vatCents,
        };
    });

    return {
        lines: calculatedLines,
        subtotalCents: calculatedLines.reduce((sum, line) => sum + line.subtotalCents, 0),
        vatCents: calculatedLines.reduce((sum, line) => sum + line.vatCents, 0),
        totalCents: calculatedLines.reduce((sum, line) => sum + line.totalCents, 0),
    };
}

export function validateInvoiceInput(
    input: InvoiceInput,
): { ok: true; data: ValidatedInvoiceInput } | { ok: false; errors: InvoiceValidationError[] } {
    const errors: InvoiceValidationError[] = [];
    const clientId = typeof input.clientId === "string" ? input.clientId.trim() : "";
    if (!clientId) errors.push({ field: "clientId", message: "Le client est requis." });

    const issueDate = parseDate(input.issueDate);
    const dueDate = parseDate(input.dueDate);
    if (!issueDate) errors.push({ field: "issueDate", message: "La date d’émission est invalide." });
    if (!dueDate) errors.push({ field: "dueDate", message: "La date d’échéance est invalide." });
    if (issueDate && dueDate && dueDate.getTime() < issueDate.getTime()) {
        errors.push({ field: "dueDate", message: "L’échéance doit être postérieure à l’émission." });
    }

    const status = input.status === undefined ? "DRAFT" : input.status;
    if (!isInvoiceStatus(status)) errors.push({ field: "status", message: "Le statut est invalide." });

    const rawLines = Array.isArray(input.lines) ? (input.lines as InvoiceLineInput[]) : [];
    if (rawLines.length === 0) errors.push({ field: "lines", message: "Ajoutez au moins une ligne." });
    if (rawLines.length > 200) errors.push({ field: "lines", message: "Une facture est limitée à 200 lignes." });

    rawLines.forEach((line, index) => {
        const field = `lines.${index}`;
        if (typeof line?.description !== "string" || !line.description.trim()) {
            errors.push({ field: `${field}.description`, message: "La désignation est requise." });
        }
        const quantityMilli = parseScaledInteger(line?.quantity, 1_000);
        if (quantityMilli === null || quantityMilli <= 0 || quantityMilli > 1_000_000_000) {
            errors.push({ field: `${field}.quantity`, message: "La quantité doit être supérieure à zéro." });
        }
        const unitPriceCents = parseScaledInteger(line?.unitPrice, 100);
        if (unitPriceCents === null || unitPriceCents < 0 || unitPriceCents > 2_000_000_000) {
            errors.push({ field: `${field}.unitPrice`, message: "Le prix unitaire est invalide." });
        }
        const vatRateBps = parseScaledInteger(line?.vatRate, 100);
        if (vatRateBps === null || vatRateBps < 0 || vatRateBps > 10_000) {
            errors.push({ field: `${field}.vatRate`, message: "Le taux de TVA doit être compris entre 0 et 100." });
        }
    });

    const paidAt = input.paidAt ? parseDate(input.paidAt) : null;
    if (input.paidAt && !paidAt) errors.push({ field: "paidAt", message: "La date de paiement est invalide." });

    if (errors.length || !issueDate || !dueDate || !isInvoiceStatus(status)) return { ok: false, errors };

    const totals = calculateInvoiceTotals(rawLines);
    return {
        ok: true,
        data: {
            clientId,
            status,
            issueDate,
            dueDate,
            paidAt: status === "PAID" ? paidAt ?? new Date() : null,
            notes: typeof input.notes === "string" ? input.notes.trim() || null : null,
            ...totals,
        },
    };
}
