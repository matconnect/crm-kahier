import type { ClientSegment, ClientStatus, RevenueSource } from "@/lib/client-enums";

export type OwnerOption = {
    id: string;
    label: string;
    email?: string | null;
};

export type ContactState = {
    id: string;
    firstName: string;
    lastName: string;
    emails: string[];
    phones: string[];
    role: string;
};

export type FormState = {
    name: string;
    ownerIds: string[];
    status: ClientStatus;
    segment: ClientSegment;
    revenueSource: RevenueSource;
    location: string;
    emails: string[];
    phones: string[];
    notes: string;
    contacts: ContactState[];
};
