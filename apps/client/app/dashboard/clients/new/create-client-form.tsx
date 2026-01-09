"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { ClientSegment, ClientStatus } from "@/lib/client-enums";
import { CLIENT_SEGMENT_OPTIONS, CLIENT_STATUS_OPTIONS } from "@/lib/client-enums";
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
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const [owners, setOwners] = React.useState<OwnerOption[]>([
        { id: currentUserId, label: currentUserLabel, email: currentUserEmail },
    ]);

    const [form, setForm] = React.useState<FormState>({
        name: "",
        ownerId: currentUserId,
        status: "PROSPECT",
        segment: "OTHER",
        location: "",
        primaryEmail: "",
        primaryPhone: "",
        notes: "",
        contacts: [createEmptyContact()],
    });

    React.useEffect(() => {
        let active = true;
        async function loadOwners() {
            try {
                if (!apiBase) throw new Error("NEXT_PUBLIC_API_URL manquant");
                const res = await fetch(`${apiBase}/users`);
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
    }, []);

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function updateContact(id: string, key: keyof Omit<ContactState, "id">, value: string) {
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

        setPending(true);
        try {
            const contactsPayload = buildContactsPayload(form.contacts);
            const payload = {
                name: form.name.trim(),
                ownerId: form.ownerId,
                status: form.status,
                segment: form.segment,
                location: clean(form.location),
                primaryEmail: clean(form.primaryEmail),
                primaryPhone: clean(form.primaryPhone),
                notes: clean(form.notes),
                contacts: contactsPayload.length ? contactsPayload : undefined,
            };

            const res = await fetch(`${apiBase}/clients`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
            <Card className="border-dashed border-muted/60">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Assigné à :{" "}
                        <span className="font-medium text-foreground">
                            {owners.find((o) => o.id === form.ownerId)?.label ?? "Moi"}
                        </span>
                    </div>
                    <div className="text-xs md:text-sm">
                        Les notes restent internes. Plusieurs contacts peuvent être ajoutés dès maintenant.
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
                <ClientInfoCard
                    form={form}
                    pending={pending}
                    owners={owners}
                    statusOptions={statusOptions}
                    segmentOptions={segmentOptions}
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
        email: "",
        phone: "",
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
            email: clean(contact.email),
            phone: clean(contact.phone),
            role: clean(contact.role),
        }))
        .filter(
            (contact) =>
                contact.firstName ||
                contact.lastName ||
                contact.email ||
                contact.phone ||
                contact.role,
        );
}
