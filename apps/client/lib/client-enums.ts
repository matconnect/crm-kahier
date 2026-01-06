export type ClientStatus = "ACTIVE" | "INACTIVE" | "PROSPECT";
export type ClientSegment = "TPE" | "PME" | "ETI" | "GE" | "OTHER";

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
