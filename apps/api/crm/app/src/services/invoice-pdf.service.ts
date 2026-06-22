import type { InvoiceStatusValue } from "./invoices.domain.js";

type PdfInvoice = {
    number: string;
    status: InvoiceStatusValue;
    issueDate: Date;
    dueDate: Date;
    paidAt: Date | null;
    notes: string | null;
    subtotalCents: number;
    vatCents: number;
    totalCents: number;
    issuerSnapshot?: unknown;
    clientSnapshot?: unknown;
    company: {
        name: string;
        legalForm?: string | null;
        capitalSocialCents?: number | null;
        siren?: string | null;
        siret?: string | null;
        vatNumber?: string | null;
        rcsCity?: string | null;
        addressLine1?: string | null;
        addressLine2?: string | null;
        postalCode?: string | null;
        city?: string | null;
        country?: string | null;
        contactEmail?: string | null;
        contactPhone?: string | null;
        paymentTerms?: string | null;
        latePenaltyRateBps?: number | null;
        fixedCompensationCents?: number | null;
    };
    client: {
        name: string;
        location: string | null;
        addressLine1?: string | null;
        addressLine2?: string | null;
        postalCode?: string | null;
        city?: string | null;
        country?: string | null;
        siren?: string | null;
        vatNumber?: string | null;
        primaryEmail: string | null;
        primaryPhone: string | null;
    };
    lines: Array<{
        description: string;
        quantityMilli: number;
        unitPriceCents: number;
        vatRateBps: number;
        subtotalCents: number;
        vatCents: number;
        totalCents: number;
    }>;
};

function pdfText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E]/g, " ")
        .replaceAll("\\", "\\\\")
        .replaceAll("(", "\\(")
        .replaceAll(")", "\\)");
}

function formatDate(value: Date): string {
    return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(value);
}

function formatMoney(cents: number): string {
    return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
}

function asObject(source: unknown): Record<string, unknown> | null {
    return source && typeof source === "object" && !Array.isArray(source) ? (source as Record<string, unknown>) : null;
}

function pickString(source: unknown, key: string, fallback = ""): string {
    const value = asObject(source)?.[key];
    return typeof value === "string" ? value : fallback;
}

function pickNumber(source: unknown, key: string, fallback = 0): number {
    const value = asObject(source)?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function formatAddress(parts: Array<string | null | undefined>): string {
    return parts.map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean).join(", ");
}

function text(x: number, y: number, value: string, size = 10, bold = false, color = "0.15 0.17 0.24") {
    return `BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg ${x} ${y} Td (${pdfText(value)}) Tj ET`;
}

function line(y: number) {
    return `0.88 0.89 0.93 RG 45 ${y} m 550 ${y} l S`;
}

function splitDescription(value: string, max = 38): string[] {
    const words = value.trim().split(/\s+/);
    const rows: string[] = [];
    for (const word of words) {
        const last = rows.at(-1);
        if (!last || `${last} ${word}`.length > max) rows.push(word);
        else rows[rows.length - 1] = `${last} ${word}`;
    }
    return rows.length ? rows : [""];
}

function buildPage(invoice: PdfInvoice, pageLines: PdfInvoice["lines"], page: number, pages: number, isLast: boolean) {
    const issuer = asObject(invoice.issuerSnapshot);
    const client = asObject(invoice.clientSnapshot);
    const issuerAddress = formatAddress([
        pickString(issuer, "addressLine1", invoice.company.addressLine1 ?? ""),
        pickString(issuer, "addressLine2", invoice.company.addressLine2 ?? ""),
        formatAddress([
            pickString(issuer, "postalCode", invoice.company.postalCode ?? ""),
            pickString(issuer, "city", invoice.company.city ?? ""),
            pickString(issuer, "country", invoice.company.country ?? ""),
        ]),
    ]);
    const clientAddress = formatAddress([
        pickString(client, "addressLine1", invoice.client.addressLine1 ?? ""),
        pickString(client, "addressLine2", invoice.client.addressLine2 ?? ""),
        formatAddress([
            pickString(client, "postalCode", invoice.client.postalCode ?? ""),
            pickString(client, "city", invoice.client.city ?? ""),
            pickString(client, "country", invoice.client.country ?? invoice.client.location ?? ""),
        ]),
    ]);
    const clientIdentity = [
        pickString(client, "siren", invoice.client.siren ?? "") ? `SIREN ${pickString(client, "siren", invoice.client.siren ?? "")}` : "",
        pickString(client, "vatNumber", invoice.client.vatNumber ?? "") ? `TVA ${pickString(client, "vatNumber", invoice.client.vatNumber ?? "")}` : "",
    ].filter(Boolean).join(" - ");
    const companyIdentity = [
        pickString(issuer, "legalForm", invoice.company.legalForm ?? ""),
        pickString(issuer, "siren", invoice.company.siren ?? "") ? `SIREN ${pickString(issuer, "siren", invoice.company.siren ?? "")}` : "",
        pickString(issuer, "siret", invoice.company.siret ?? "") ? `SIRET ${pickString(issuer, "siret", invoice.company.siret ?? "")}` : "",
    ].filter(Boolean).join(" - ");
    const companyTax = [
        pickString(issuer, "vatNumber", invoice.company.vatNumber ?? "") ? `TVA ${pickString(issuer, "vatNumber", invoice.company.vatNumber ?? "")}` : "",
        pickString(issuer, "rcsCity", invoice.company.rcsCity ?? "") ? `RCS ${pickString(issuer, "rcsCity", invoice.company.rcsCity ?? "")}` : "",
        pickNumber(issuer, "capitalSocialCents", invoice.company.capitalSocialCents ?? 0) > 0
            ? `Capital ${formatMoney(pickNumber(issuer, "capitalSocialCents", invoice.company.capitalSocialCents ?? 0))}`
            : "",
    ].filter(Boolean).join(" - ");
    const commands: string[] = [
        "0.98 0.98 0.99 rg 0 0 595 842 re f",
        "0.07 0.08 0.13 rg 0 742 595 100 re f",
        text(45, 792, invoice.company.name, 17, true, "1 1 1"),
        text(45, 765, "FACTURE", 10, true, "0.78 0.80 0.88"),
        text(380, 792, invoice.number, 15, true, "1 1 1"),
        text(45, 705, "FACTURE A", 9, true, "0.42 0.45 0.55"),
        text(45, 680, invoice.client.name, 13, true),
        text(45, 660, clientAddress, 9),
        text(45, 644, pickString(client, "primaryEmail", invoice.client.primaryEmail ?? ""), 9),
        text(45, 631, clientIdentity, 8, false, "0.42 0.45 0.55"),
        text(360, 705, "Emission", 9, true, "0.42 0.45 0.55"),
        text(470, 705, formatDate(invoice.issueDate), 9),
        text(360, 684, "Echeance", 9, true, "0.42 0.45 0.55"),
        text(470, 684, formatDate(invoice.dueDate), 9),
        text(45, 620, issuerAddress, 8, false, "0.42 0.45 0.55"),
        text(45, 608, companyIdentity, 8, false, "0.42 0.45 0.55"),
        text(45, 596, companyTax, 8, false, "0.42 0.45 0.55"),
        "0.94 0.95 0.97 rg 45 594 505 32 re f",
        text(55, 606, "DESIGNATION", 8, true, "0.30 0.33 0.42"),
        text(315, 606, "QTE", 8, true, "0.30 0.33 0.42"),
        text(370, 606, "P.U. HT", 8, true, "0.30 0.33 0.42"),
        text(448, 606, "TVA", 8, true, "0.30 0.33 0.42"),
        text(495, 606, "TOTAL HT", 8, true, "0.30 0.33 0.42"),
    ];

    let y = 570;
    for (const item of pageLines) {
        const descriptions = splitDescription(item.description);
        commands.push(text(55, y, descriptions[0] ?? "", 9));
        commands.push(text(315, y, String(item.quantityMilli / 1_000), 9));
        commands.push(text(370, y, formatMoney(item.unitPriceCents), 9));
        commands.push(text(448, y, `${item.vatRateBps / 100} %`, 9));
        commands.push(text(495, y, formatMoney(item.subtotalCents), 9));
        descriptions.slice(1, 2).forEach((row) => commands.push(text(55, y - 13, row, 9)));
        y -= descriptions.length > 1 ? 42 : 30;
        commands.push(line(y + 14));
    }

    if (isLast) {
        const totalsY = Math.min(y - 12, 250);
        commands.push(text(390, totalsY, "Total HT", 10, true));
        commands.push(text(485, totalsY, formatMoney(invoice.subtotalCents), 10, true));
        commands.push(text(390, totalsY - 24, "TVA", 10));
        commands.push(text(485, totalsY - 24, formatMoney(invoice.vatCents), 10));
        commands.push("0.07 0.08 0.13 rg 375 " + (totalsY - 72) + " 175 34 re f");
        commands.push(text(390, totalsY - 60, "TOTAL TTC", 11, true, "1 1 1"));
        commands.push(text(480, totalsY - 60, formatMoney(invoice.totalCents), 11, true, "1 1 1"));
        if (invoice.notes) {
            commands.push(text(45, totalsY - 15, "Notes", 9, true, "0.42 0.45 0.55"));
            commands.push(text(45, totalsY - 35, invoice.notes.slice(0, 75), 9));
        }
        const paymentTerms = pickString(issuer, "paymentTerms", invoice.company.paymentTerms ?? "");
        const latePenaltyRateBps = pickNumber(issuer, "latePenaltyRateBps", invoice.company.latePenaltyRateBps ?? 0);
        const fixedCompensationCents = pickNumber(
            issuer,
            "fixedCompensationCents",
            invoice.company.fixedCompensationCents ?? 4000,
        );
        if (paymentTerms) commands.push(text(45, 120, `Conditions de paiement : ${paymentTerms}`.slice(0, 95), 8));
        if (latePenaltyRateBps > 0) {
            commands.push(text(45, 106, `Penalites de retard : ${(latePenaltyRateBps / 100).toLocaleString("fr-FR")} %`.slice(0, 95), 8));
        }
        commands.push(text(45, 92, `Indemnite forfaitaire de recouvrement : ${formatMoney(fixedCompensationCents)}`.slice(0, 95), 8));
    }

    commands.push(text(45, 35, invoice.number, 8, false, "0.50 0.52 0.60"));
    commands.push(text(500, 35, `${page} / ${pages}`, 8, false, "0.50 0.52 0.60"));
    return commands.join("\n");
}

export function generateInvoicePdf(invoice: PdfInvoice): Buffer {
    const chunks: PdfInvoice["lines"][] = [];
    for (let index = 0; index < invoice.lines.length; index += 10) chunks.push(invoice.lines.slice(index, index + 10));
    if (!chunks.length) chunks.push([]);

    const streams = chunks.map((items, index) => buildPage(invoice, items, index + 1, chunks.length, index === chunks.length - 1));
    const pageObjectIds = streams.map((_, index) => 5 + index * 2);
    const objects: string[] = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`,
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ];

    streams.forEach((stream, index) => {
        const pageId = pageObjectIds[index]!;
        objects[pageId - 1] =
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
        objects[pageId] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;
    });

    let document = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets[index + 1] = Buffer.byteLength(document, "latin1");
        document += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = Buffer.byteLength(document, "latin1");
    document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    document += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
    document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(document, "latin1");
}
