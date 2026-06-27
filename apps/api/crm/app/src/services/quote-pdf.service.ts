import type { QuoteStatusValue } from "./quotes.domain.js";

type PdfQuote = {
    number: string;
    status: QuoteStatusValue;
    issueDate: Date;
    expiryDate: Date;
    acceptedAt: Date | null;
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

function buildPage(quote: PdfQuote, pageLines: PdfQuote["lines"], page: number, pages: number, isLast: boolean) {
    const issuer = asObject(quote.issuerSnapshot);
    const client = asObject(quote.clientSnapshot);
    const issuerAddress = formatAddress([
        pickString(issuer, "addressLine1", quote.company.addressLine1 ?? ""),
        pickString(issuer, "addressLine2", quote.company.addressLine2 ?? ""),
        formatAddress([
            pickString(issuer, "postalCode", quote.company.postalCode ?? ""),
            pickString(issuer, "city", quote.company.city ?? ""),
            pickString(issuer, "country", quote.company.country ?? ""),
        ]),
    ]);
    const clientAddress = formatAddress([
        pickString(client, "addressLine1", quote.client.addressLine1 ?? ""),
        pickString(client, "addressLine2", quote.client.addressLine2 ?? ""),
        formatAddress([
            pickString(client, "postalCode", quote.client.postalCode ?? ""),
            pickString(client, "city", quote.client.city ?? ""),
            pickString(client, "country", quote.client.country ?? quote.client.location ?? ""),
        ]),
    ]);
    const companyLegalLine = [
        pickString(issuer, "legalForm", quote.company.legalForm ?? ""),
        pickString(issuer, "siren", quote.company.siren ?? "") ? `SIREN ${pickString(issuer, "siren", quote.company.siren ?? "")}` : "",
        pickString(issuer, "siret", quote.company.siret ?? "") ? `SIRET ${pickString(issuer, "siret", quote.company.siret ?? "")}` : "",
    ].filter(Boolean).join(" - ");
    const companyTaxLine = [
        pickString(issuer, "vatNumber", quote.company.vatNumber ?? "") ? `TVA ${pickString(issuer, "vatNumber", quote.company.vatNumber ?? "")}` : "",
        pickString(issuer, "rcsCity", quote.company.rcsCity ?? "") ? `RCS ${pickString(issuer, "rcsCity", quote.company.rcsCity ?? "")}` : "",
    ].filter(Boolean).join(" - ");
    const companyContactLine = [
        pickString(issuer, "contactEmail", quote.company.contactEmail ?? ""),
        pickString(issuer, "contactPhone", quote.company.contactPhone ?? ""),
    ].filter(Boolean).join(" - ");
    const companyMetaLine = [
        companyLegalLine,
        companyTaxLine,
        companyContactLine,
        pickNumber(issuer, "capitalSocialCents", quote.company.capitalSocialCents ?? 0) > 0
            ? `Capital ${formatMoney(pickNumber(issuer, "capitalSocialCents", quote.company.capitalSocialCents ?? 0))}`
            : "",
    ].filter(Boolean).join(" - ");
    const clientIdentityLine = [
        pickString(client, "siren", quote.client.siren ?? "") ? `SIREN ${pickString(client, "siren", quote.client.siren ?? "")}` : "",
        pickString(client, "vatNumber", quote.client.vatNumber ?? "") ? `TVA ${pickString(client, "vatNumber", quote.client.vatNumber ?? "")}` : "",
    ].filter(Boolean).join(" - ");
    const clientContactLine = [
        pickString(client, "primaryEmail", quote.client.primaryEmail ?? ""),
        pickString(client, "primaryPhone", quote.client.primaryPhone ?? ""),
    ].filter(Boolean).join(" - ");
    const commands: string[] = [
        "0.98 0.98 0.99 rg 0 0 595 842 re f",
        "0.07 0.08 0.13 rg 0 742 595 100 re f",
        text(45, 792, quote.company.name, 17, true, "1 1 1"),
        text(45, 765, "DEVIS", 10, true, "0.78 0.80 0.88"),
        text(380, 792, quote.number, 15, true, "1 1 1"),
        text(360, 705, "Emission", 9, true, "0.42 0.45 0.55"),
        text(470, 705, formatDate(quote.issueDate), 9),
        text(360, 684, "Validite", 9, true, "0.42 0.45 0.55"),
        text(470, 684, formatDate(quote.expiryDate), 9),
        "1 1 1 rg 45 592 245 88 re f",
        "0.88 0.89 0.93 RG 45 592 245 88 re S",
        "1 1 1 rg 305 592 245 88 re f",
        "0.88 0.89 0.93 RG 305 592 245 88 re S",
        text(58, 661, "EMIS PAR", 8, true, "0.42 0.45 0.55"),
        text(58, 643, quote.company.name, 12, true),
        text(58, 626, issuerAddress || quote.company.addressLine1 || "", 8, false, "0.42 0.45 0.55"),
        text(58, 611, companyMetaLine || "", 7.2, false, "0.42 0.45 0.55"),
        text(58, 597, "", 7.2, false, "0.42 0.45 0.55"),
        text(323, 661, "DESTINATAIRE", 8, true, "0.42 0.45 0.55"),
        text(323, 643, quote.client.name, 12, true),
        text(323, 626, clientAddress || quote.client.location || "", 8, false, "0.42 0.45 0.55"),
        text(323, 611, clientIdentityLine || clientContactLine || "", 7.2, false, "0.42 0.45 0.55"),
        text(323, 597, "", 7.2, false, "0.42 0.45 0.55"),
        "0.94 0.95 0.97 rg 45 556 505 32 re f",
        text(55, 568, "DESIGNATION", 8, true, "0.30 0.33 0.42"),
        text(315, 568, "QTE", 8, true, "0.30 0.33 0.42"),
        text(370, 568, "P.U. HT", 8, true, "0.30 0.33 0.42"),
        text(448, 568, "TVA", 8, true, "0.30 0.33 0.42"),
        text(495, 568, "TOTAL HT", 8, true, "0.30 0.33 0.42"),
    ];

    let y = 532;
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
        const totalsY = Math.min(y - 12, 330);
        commands.push(text(390, totalsY, "Total HT", 10, true));
        commands.push(text(485, totalsY, formatMoney(quote.subtotalCents), 10, true));
        commands.push(text(390, totalsY - 24, "TVA", 10));
        commands.push(text(485, totalsY - 24, formatMoney(quote.vatCents), 10));
        commands.push("0.07 0.08 0.13 rg 375 " + (totalsY - 72) + " 175 34 re f");
        commands.push(text(390, totalsY - 60, "TOTAL TTC", 11, true, "1 1 1"));
        commands.push(text(480, totalsY - 60, formatMoney(quote.totalCents), 11, true, "1 1 1"));
        if (quote.notes) {
            commands.push(text(45, totalsY - 15, "Notes", 9, true, "0.42 0.45 0.55"));
            commands.push(text(45, totalsY - 35, quote.notes.slice(0, 75), 9));
        }

        const agreementTop = 118;
        commands.push("0.97 0.98 1 rg 45 " + agreementTop + " 505 96 re f");
        commands.push("0.88 0.89 0.93 RG 45 " + agreementTop + " 505 96 re S");
        commands.push(text(58, agreementTop + 68, "Bon pour accord", 12, true));
        commands.push(text(58, agreementTop + 49, "Nom du signataire :", 9, true, "0.42 0.45 0.55"));
        commands.push(text(158, agreementTop + 49, "........................................", 9, false, "0.42 0.45 0.55"));
        commands.push(text(58, agreementTop + 32, "Date :", 9, true, "0.42 0.45 0.55"));
        commands.push(text(100, agreementTop + 32, "........................................", 9, false, "0.42 0.45 0.55"));
        commands.push(text(58, agreementTop + 15, "Signature :", 9, true, "0.42 0.45 0.55"));
        commands.push(text(118, agreementTop + 15, "............................................................", 9, false, "0.42 0.45 0.55"));
    }

    commands.push(text(45, 35, quote.number, 8, false, "0.50 0.52 0.60"));
    commands.push(text(500, 35, `${page} / ${pages}`, 8, false, "0.50 0.52 0.60"));
    return commands.join("\n");
}

export function generateQuotePdf(quote: PdfQuote): Buffer {
    const chunks: PdfQuote["lines"][] = [];
    for (let index = 0; index < quote.lines.length; index += 10) chunks.push(quote.lines.slice(index, index + 10));
    if (!chunks.length) chunks.push([]);

    const streams = chunks.map((items, index) => buildPage(quote, items, index + 1, chunks.length, index === chunks.length - 1));
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
