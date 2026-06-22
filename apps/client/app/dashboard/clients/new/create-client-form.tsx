"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CLIENT_REVENUE_SOURCE_OPTIONS, CLIENT_SEGMENT_OPTIONS, CLIENT_STATUS_OPTIONS } from "@/lib/client-enums";
import { getBrowserApiBase } from "@/lib/public-api-base";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";

import { ClientInfoCard } from "./components/client-info-card";
import { ContactsCard } from "./components/contacts-card";
import { NotesCard } from "./components/notes-card";
import type { ContactState, FormState, OwnerOption } from "./types";

const statusOptions = CLIENT_STATUS_OPTIONS.map((s) => ({
    ...s,
    label: s.value === "INACTIVE" ? "Ancien client" : s.label,
}));

const segmentOptions = CLIENT_SEGMENT_OPTIONS;
const revenueSourceOptions = CLIENT_REVENUE_SOURCE_OPTIONS;

const textareaClass =
    "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
    currentUserId: string;
    currentUserLabel: string;
    currentUserEmail?: string | null;
};

export function CreateClientForm({ currentUserId, currentUserLabel, currentUserEmail }: Props) {
    const router = useRouter();
    const [pending, setPending] = React.useState(false);
    const apiBase = getBrowserApiBase();
    const [owners, setOwners] = React.useState<OwnerOption[]>([
        { id: currentUserId, label: currentUserLabel, email: currentUserEmail },
    ]);

    const [form, setForm] = React.useState<FormState>({
        name: "",
        ownerIds: [currentUserId].filter(Boolean),
        status: "PROSPECT",
        segment: "OTHER",
        revenueSource: "OTHER",
        location: "",
        addressLine1: "",
        addressLine2: "",
        postalCode: "",
        city: "",
        country: "",
        siren: "",
        vatNumber: "",
        emails: [""],
        phones: [""],
        notes: "",
        contacts: [createEmptyContact()],
    });

    React.useEffect(() => {
        let active = true;
        async function loadOwners() {
            try {
                if (!apiBase) throw new Error("NEXT_PUBLIC_API_URL manquant");
                const res = await fetch(`${apiBase}/users`, {
                    headers: currentUserId ? { "x-user-id": currentUserId } : undefined,
                });
                const data = (await res.json()) as { users?: OwnerOption[]; error?: string };
                if (!res.ok) throw new Error(data.error ?? "Impossible de charger les utilisateurs.");
                if (!active || !data.users) return;

                const incoming = data.users ?? [];
                if (!incoming.length) return;

                setOwners((prev) => {
                    const map = new Map(prev.map((o) => [o.id, o]));
                    incoming.forEach((u) => map.set(u.id, u));
                    return Array.from(map.values());
                });
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        }
        void loadOwners();
        return () => {
            active = false;
        };
    }, [apiBase]);

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function updateContact(id: string, key: keyof Omit<ContactState, "id">, value: string | string[]) {
        setForm((prev) => ({
            ...prev,
            contacts: prev.contacts.map((contact) =>
                contact.id === id ? { ...contact, [key]: value } : contact,
            ),
        }));
    }

    function addContact() {
        setForm((prev) => ({ ...prev, contacts: [...prev.contacts, createEmptyContact()] }));
    }

    function removeContact(id: string) {
        setForm((prev) => {
            const remaining = prev.contacts.filter((c) => c.id !== id);
            return { ...prev, contacts: remaining.length ? remaining : [createEmptyContact()] };
        });
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error("Ajoute un nom de client.");
            return;
        }
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur non authentifié.");
            return;
        }

        setPending(true);
        try {
            const contactsPayload = buildContactsPayload(form.contacts);
            const emails = normalizeEmailList(form.emails);
            const phones = normalizePhoneList(form.phones);
            if (emails.some((email) => !isValidEmail(email))) {
                toast.error("Un email client est invalide.");
                return;
            }
            if (phones.some((phone) => !isValidPhone(phone))) {
                toast.error("Un téléphone client est invalide.");
                return;
            }
            const invalidContactEmail = form.contacts.find((contact) =>
                normalizeEmailList(contact.emails).some((email) => !isValidEmail(email)),
            );
            if (invalidContactEmail) {
                toast.error("Un email de contact est invalide.");
                return;
            }
            const invalidContactPhone = form.contacts.find((contact) =>
                normalizePhoneList(contact.phones).some((phone) => !isValidPhone(phone)),
            );
            if (invalidContactPhone) {
                toast.error("Un téléphone de contact est invalide.");
                return;
            }
            const payload = {
                name: form.name.trim(),
                ownerIds: form.ownerIds,
                ownerId: form.ownerIds[0] ?? null,
                status: form.status,
                segment: form.segment,
                revenueSource: form.revenueSource,
                location: clean(form.location),
                addressLine1: clean(form.addressLine1),
                addressLine2: clean(form.addressLine2),
                postalCode: clean(form.postalCode),
                city: clean(form.city),
                country: clean(form.country),
                siren: clean(form.siren),
                vatNumber: clean(form.vatNumber),
                emails: emails.length ? emails : undefined,
                phones: phones.length ? phones : undefined,
                primaryEmail: emails[0] ?? null,
                primaryPhone: phones[0] ?? null,
                notes: clean(form.notes),
                contacts: contactsPayload.length ? contactsPayload : undefined,
            };

            const res = await fetch(`${apiBase}/clients`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-user-id": currentUserId },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(data?.error ?? "Impossible de créer le client.");
            }

            toast.success("Client créé avec succès.");
            router.push("/dashboard/clients");
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur inattendue.";
            toast.error(message);
        } finally {
            setPending(false);
        }
    }

    return (
        <form id="client-create-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
                <ClientInfoCard
                    form={form}
                    pending={pending}
                    owners={owners}
                    statusOptions={statusOptions}
                    segmentOptions={segmentOptions}
                    revenueSourceOptions={revenueSourceOptions}
                    onChange={update}
                />

                <ContactsCard
                    contacts={form.contacts}
                    pending={pending}
                    onChange={updateContact}
                    onAdd={addContact}
                    onRemove={removeContact}
                />
            </div>

            <NotesCard
                notes={form.notes}
                pending={pending}
                textareaClass={textareaClass}
                onChange={(value) => update("notes", value)}
            />
        </form>
    );
}

function createEmptyContact(): ContactState {
    return {
        id: crypto.randomUUID ? crypto.randomUUID() : `contact-${Date.now()}`,
        firstName: "",
        lastName: "",
        emails: [""],
        phones: [""],
        role: "",
    };
}

function clean(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function buildContactsPayload(contacts: ContactState[]) {
    return contacts
        .map((contact) => ({
            firstName: clean(contact.firstName),
            lastName: clean(contact.lastName),
            emails: normalizeEmailList(contact.emails),
            phones: normalizePhoneList(contact.phones),
            email: normalizeEmailList(contact.emails)[0] ?? null,
            phone: normalizePhoneList(contact.phones)[0] ?? null,
            role: clean(contact.role),
        }))
        .filter(
            (contact) =>
                contact.firstName ||
                contact.lastName ||
                contact.email ||
                contact.phone ||
                (contact.emails && contact.emails.length > 0) ||
                (contact.phones && contact.phones.length > 0) ||
                contact.role,
        );
}

function normalizeEmailList(values: string[]) {
    return values.map(normalizeEmail).filter(Boolean);
}

function normalizePhoneList(values: string[]) {
    return values.map(normalizePhone).filter(Boolean);
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
    return value.replace(/\s+/g, "").replace(/[\-().]/g, "").trim();
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
    return /^[+]?[\d]{6,}$/.test(value.replace(/[^\d+]/g, ""));
}
