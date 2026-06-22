"use client";

import * as React from "react";
import { UserPlus, Save } from "lucide-react";
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
    currentUserId: string;
    triggerClassName?: string;
};

export function AddContactDialog({ clientId, currentUserId, triggerClassName }: Props) {
    const apiBase = getBrowserApiBase();
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [emails, setEmails] = React.useState<string[]>([""]);
    const [phones, setPhones] = React.useState<string[]>([""]);
    const [role, setRole] = React.useState("");

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
        const cleanEmails = emails.map(normalizeEmail).filter(Boolean);
        const cleanPhones = phones.map(normalizePhone).filter(Boolean);
        if (!firstName && !lastName && cleanEmails.length === 0 && cleanPhones.length === 0 && !role) {
            toast.error("Ajoute au moins une information de contact");
            return;
        }
        if (cleanEmails.some((value) => !isValidEmail(value))) {
            toast.error("Un email est invalide");
            return;
        }
        if (cleanPhones.some((value) => !isValidPhone(value))) {
            toast.error("Un téléphone est invalide");
            return;
        }

        setPending(true);
        try {
            const res = await fetch(`${apiBase}/clients/${clientId}/contacts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": currentUserId,
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    emails: cleanEmails,
                    phones: cleanPhones,
                    email: cleanEmails[0] ?? null,
                    phone: cleanPhones[0] ?? null,
                    role,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error ?? "Impossible d'ajouter le contact");
            toast.success("Contact ajouté");
            setOpen(false);
            setFirstName("");
            setLastName("");
            setEmails([""]);
            setPhones([""]);
            setRole("");
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
                <Button variant="outline" size="sm" className={["gap-2 text-black", triggerClassName ?? ""].filter(Boolean).join(" ")}>
                    <UserPlus className="h-4 w-4" />
                    Ajouter un contact
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nouveau contact</DialogTitle>
                    <DialogDescription>Associe rapidement un contact à ce client.</DialogDescription>
                </DialogHeader>
                <form className="space-y-3" onSubmit={onSubmit}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Prénom</Label>
                            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Sophie" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nom</Label>
                            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Martin" />
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <MultiInput
                            label="Emails"
                            type="email"
                            placeholder="sophie@client.com"
                            values={emails}
                            onChange={setEmails}
                            disabled={pending}
                        />
                        <MultiInput
                            label="Téléphones"
                            placeholder="+33 6 12 34 56 78"
                            values={phones}
                            onChange={setPhones}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Rôle</Label>
                        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="DAF, CEO..." />
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
