export type ClientStatus = "ACTIVE" | "INACTIVE" | "PROSPECT";
export type ClientSegment = "TPE" | "PME" | "ETI" | "GE" | "OTHER";
export type RevenueSource = "REFERRAL" | "OUTBOUND" | "ADS" | "PARTNER" | "UPSELL" | "OTHER";

export const CLIENT_STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
    { value: "PROSPECT", label: "Prospect" },
    { value: "ACTIVE", label: "Client actif" },
    { value: "INACTIVE", label: "Client inactif" },
];

export const CLIENT_SEGMENT_OPTIONS: { value: ClientSegment; label: string }[] = [
    { value: "TPE", label: "TPE" },
    { value: "PME", label: "PME" },
    { value: "ETI", label: "ETI" },
    { value: "GE", label: "Grand compte" },
    { value: "OTHER", label: "Autre" },
];

export const CLIENT_REVENUE_SOURCE_OPTIONS: { value: RevenueSource; label: string }[] = [
    { value: "REFERRAL", label: "Recommandation" },
    { value: "OUTBOUND", label: "Prospection" },
    { value: "ADS", label: "Publicité" },
    { value: "PARTNER", label: "Partenaire" },
    { value: "UPSELL", label: "Upsell" },
    { value: "OTHER", label: "Autre" },
];

export function getRevenueSourceLabel(value: RevenueSource | null | undefined) {
    if (!value) return "Non renseignée";
    return CLIENT_REVENUE_SOURCE_OPTIONS.find((option) => option.value === value)?.label ?? "Non renseignée";
}
