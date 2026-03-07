"use client";

import * as React from "react";
import { Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { getBrowserApiBase } from "@/lib/public-api-base";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiInput } from "@/components/ui/multi-input";

type Props = {
    clientId: string;
    contact: {
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        emails?: string[] | null;
        phones?: string[] | null;
        role: string | null;
    };
    currentUserId: string;
};

export function EditContactDialog({ clientId, contact, currentUserId }: Props) {
    const apiBase = getBrowserApiBase();
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    const [firstName, setFirstName] = React.useState(contact.firstName ?? "");
    const [lastName, setLastName] = React.useState(contact.lastName ?? "");
    const [emails, setEmails] = React.useState<string[]>(contact.emails?.length ? contact.emails : [contact.email ?? ""]);
    const [phones, setPhones] = React.useState<string[]>(contact.phones?.length ? contact.phones : [contact.phone ?? ""]);
    const [role, setRole] = React.useState(contact.role ?? "");

    function isValidEmail(value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function isValidPhone(value: string) {
        return /^[+]?[\d]{6,}$/.test(value.replace(/[^\d+]/g, ""));
    }

    function normalizeEmail(value: string) {
        return value.trim().toLowerCase();
    }

    function normalizePhone(value: string) {
        return value.replace(/\s+/g, "").replace(/[\-().]/g, "").trim();
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!apiBase) {
            toast.error("NEXT_PUBLIC_API_URL manquant");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur non authentifié");
            return;
        }

        setPending(true);
        try {
            const cleanEmails = emails.map(normalizeEmail).filter(Boolean);
            const cleanPhones = phones.map(normalizePhone).filter(Boolean);
            if (cleanEmails.some((email) => !isValidEmail(email))) {
                toast.error("Un email est invalide");
                return;
            }
            if (cleanPhones.some((phone) => !isValidPhone(phone))) {
                toast.error("Un téléphone est invalide");
                return;
            }
            const res = await fetch(`${apiBase}/clients/${clientId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": currentUserId,
                },
                body: JSON.stringify({
                    contacts: {
                        update: [
                            {
                                where: { id: contact.id },
                                data: {
                                    firstName: firstName.trim() || "Contact",
                                    lastName: lastName.trim(),
                                    emails: cleanEmails.length ? cleanEmails : undefined,
                                    phones: cleanPhones.length ? cleanPhones : undefined,
                                    email: cleanEmails[0] ?? null,
                                    phone: cleanPhones[0] ?? null,
                                    role: role.trim() || null,
                                },
                            },
                        ],
                    },
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error ?? "Impossible de mettre à jour le contact");
            toast.success("Contact mis à jour");
            setOpen(false);
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur inattendue");
        } finally {
            setPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Modifier
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le contact</DialogTitle>
                    <DialogDescription>Met à jour les informations du contact.</DialogDescription>
                </DialogHeader>
                <form className="space-y-3" onSubmit={onSubmit}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Prénom</Label>
                            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Nom</Label>
                            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <MultiInput
                            label="Emails"
                            type="email"
                            values={emails}
                            onChange={setEmails}
                            disabled={pending}
                        />
                        <MultiInput
                            label="Téléphones"
                            values={phones}
                            onChange={setPhones}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Rôle</Label>
                        <Input value={role} onChange={(e) => setRole(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={pending} className="gap-2">
                            <Save className="h-4 w-4" />
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
