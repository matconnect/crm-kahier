"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CLIENT_REVENUE_SOURCE_OPTIONS, CLIENT_SEGMENT_OPTIONS, CLIENT_STATUS_OPTIONS } from "@/lib/client-enums";
import { getBrowserApiBase } from "@/lib/public-api-base";
import { toast } from "sonner";

import { ClientInfoCard } from "../new/components/client-info-card";
import { NotesCard } from "../new/components/notes-card";
import type { FormState, OwnerOption } from "../new/types";

const statusOptions = CLIENT_STATUS_OPTIONS.map((s) => ({
    ...s,
    label: s.value === "INACTIVE" ? "Ancien client" : s.label,
}));

const textareaClass =
    "border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

type Props = {
    clientId: string;
    currentUserId: string;
    currentUserLabel: string;
    currentUserEmail?: string | null;
    initialForm: FormState;
};

export function EditClientPageForm({
    clientId,
    currentUserId,
    currentUserLabel,
    currentUserEmail,
    initialForm,
}: Props) {
    const router = useRouter();
    const apiBase = getBrowserApiBase();
    const [pending, setPending] = React.useState(false);
    const [owners, setOwners] = React.useState<OwnerOption[]>([
        { id: currentUserId, label: currentUserLabel, email: currentUserEmail },
    ]);
    const [form, setForm] = React.useState<FormState>(initialForm);

    React.useEffect(() => {
        setForm(initialForm);
    }, [initialForm]);

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

                setOwners((prev) => {
                    const map = new Map(prev.map((owner) => [owner.id, owner]));
                    data.users?.forEach((owner) => map.set(owner.id, owner));
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
    }, [apiBase, currentUserId]);

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.name.trim()) {
            toast.error("Le nom du client est requis.");
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

            const payload = {
                name: form.name.trim(),
                ownerIds: form.ownerIds,
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
                emails,
                phones,
                primaryEmail: emails[0] ?? null,
                primaryPhone: phones[0] ?? null,
                notes: clean(form.notes),
            };

            const res = await fetch(`${apiBase}/clients/${clientId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-user-id": currentUserId },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(data?.error ?? "Impossible de mettre à jour le client.");
            }

            toast.success("Client mis à jour.");
            router.push(`/dashboard/clients/${clientId}`);
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur inattendue.";
            toast.error(message);
        } finally {
            setPending(false);
        }
    }

    return (
        <form id="client-edit-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
                <ClientInfoCard
                    form={form}
                    pending={pending}
                    owners={owners}
                    statusOptions={statusOptions}
                    segmentOptions={CLIENT_SEGMENT_OPTIONS}
                    revenueSourceOptions={CLIENT_REVENUE_SOURCE_OPTIONS}
                    onChange={update}
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

function clean(value: string) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function normalizeEmailList(values: string[]) {
    return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

function normalizePhoneList(values: string[]) {
    return values.map((value) => value.replace(/\s+/g, "").replace(/[\-().]/g, "").trim()).filter(Boolean);
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
    return /^[+]?[\d]{6,}$/.test(phone.replace(/[^\d+]/g, ""));
}
