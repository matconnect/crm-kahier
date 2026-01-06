import type { ClientSegment, ClientStatus } from "@prisma/client";

export type OwnerOption = {
    id: string;
    label: string;
    email?: string | null;
};

export type ContactState = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
};

export type FormState = {
    name: string;
    ownerId: string;
    status: ClientStatus;
    segment: ClientSegment;
    location: string;
    primaryEmail: string;
    primaryPhone: string;
    notes: string;
    contacts: ContactState[];
};
