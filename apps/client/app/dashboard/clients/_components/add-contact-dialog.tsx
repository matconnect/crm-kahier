"use client";

import * as React from "react";
import { UserPlus, Save } from "lucide-react";
import { toast } from "sonner";

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

type Props = {
    clientId: string;
    currentUserId: string;
};

export function AddContactDialog({ clientId, currentUserId }: Props) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [phone, setPhone] = React.useState("");
    const [role, setRole] = React.useState("");

    function isValidEmail(value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function isValidPhone(value: string) {
        return /^[+]?[\d\s().-]{6,}$/.test(value);
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
        if (!firstName && !lastName && !email && !phone && !role) {
            toast.error("Ajoute au moins une information de contact");
            return;
        }
        if (email && !isValidEmail(email)) {
            toast.error("Email invalide");
            return;
        }
        if (phone && !isValidPhone(phone)) {
            toast.error("Téléphone invalide");
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
                    email,
                    phone,
                    role,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error ?? "Impossible d'ajouter le contact");
            toast.success("Contact ajouté");
            setOpen(false);
            setFirstName("");
            setLastName("");
            setEmail("");
            setPhone("");
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
                <Button variant="outline" size="sm" className="gap-2">
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
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sophie@client.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Téléphone</Label>
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
                        </div>
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
