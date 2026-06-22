export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"] as const;
export type QuoteStatusValue = (typeof QUOTE_STATUSES)[number];

export type QuoteLineInput = {
    description?: unknown;
    quantity?: unknown;
    unitPrice?: unknown;
    vatRate?: unknown;
};

export type QuoteInput = {
    clientId?: unknown;
    status?: unknown;
    issueDate?: unknown;
    expiryDate?: unknown;
    acceptedAt?: unknown;
    notes?: unknown;
    lines?: unknown;
};

export type QuoteValidationError = {
    field: string;
    message: string;
};

export type CalculatedQuoteLine = {
    description: string;
    quantityMilli: number;
    unitPriceCents: number;
    vatRateBps: number;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
};

export type ValidatedQuoteInput = {
    clientId: string;
    status: QuoteStatusValue;
    issueDate: Date;
    expiryDate: Date;
    acceptedAt: Date | null;
    notes: string | null;
    lines: CalculatedQuoteLine[];
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
};

const STATUS_TRANSITIONS: Record<QuoteStatusValue, readonly QuoteStatusValue[]> = {
    DRAFT: ["DRAFT", "SENT", "CANCELLED"],
    SENT: ["SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
    ACCEPTED: ["SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
    REJECTED: ["SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
    EXPIRED: ["SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
    CANCELLED: ["SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
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

export function isQuoteStatus(value: unknown): value is QuoteStatusValue {
    return typeof value === "string" && QUOTE_STATUSES.includes(value as QuoteStatusValue);
}

export function formatQuoteNumber(year: number, sequence: number): string {
    return `DEV-${year}-${String(sequence).padStart(4, "0")}`;
}

export function isQuoteStatusTransitionAllowed(currentStatus: QuoteStatusValue, nextStatus: QuoteStatusValue): boolean {
    return STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function getEffectiveQuoteStatus(status: QuoteStatusValue, expiryDate: Date, now = new Date()): QuoteStatusValue {
    if (status === "SENT" && expiryDate.getTime() < now.getTime()) return "EXPIRED";
    return status;
}

export function calculateQuoteTotals(lines: QuoteLineInput[]) {
    const calculatedLines: CalculatedQuoteLine[] = lines.map((line) => {
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

export function validateQuoteInput(
    input: QuoteInput,
): { ok: true; data: ValidatedQuoteInput } | { ok: false; errors: QuoteValidationError[] } {
    const errors: QuoteValidationError[] = [];
    const clientId = typeof input.clientId === "string" ? input.clientId.trim() : "";
    if (!clientId) errors.push({ field: "clientId", message: "Le client est requis." });

    const issueDate = parseDate(input.issueDate);
    const expiryDate = parseDate(input.expiryDate);
    if (!issueDate) errors.push({ field: "issueDate", message: "La date d’émission est invalide." });
    if (!expiryDate) errors.push({ field: "expiryDate", message: "La date de validité est invalide." });
    if (issueDate && expiryDate && expiryDate.getTime() < issueDate.getTime()) {
        errors.push({ field: "expiryDate", message: "La validité doit être postérieure à l’émission." });
    }

    const status = input.status === undefined ? "DRAFT" : input.status;
    if (!isQuoteStatus(status)) errors.push({ field: "status", message: "Le statut est invalide." });

    const rawLines = Array.isArray(input.lines) ? (input.lines as QuoteLineInput[]) : [];
    if (rawLines.length === 0) errors.push({ field: "lines", message: "Ajoutez au moins une ligne." });
    if (rawLines.length > 200) errors.push({ field: "lines", message: "Un devis est limité à 200 lignes." });

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

    const acceptedAt = input.acceptedAt ? parseDate(input.acceptedAt) : null;
    if (input.acceptedAt && !acceptedAt) errors.push({ field: "acceptedAt", message: "La date d’acceptation est invalide." });

    if (errors.length || !issueDate || !expiryDate || !isQuoteStatus(status)) return { ok: false, errors };

    const totals = calculateQuoteTotals(rawLines);
    return {
        ok: true,
        data: {
            clientId,
            status,
            issueDate,
            expiryDate,
            acceptedAt: status === "ACCEPTED" ? acceptedAt ?? new Date() : null,
            notes: typeof input.notes === "string" ? input.notes.trim() || null : null,
            ...totals,
        },
    };
}
