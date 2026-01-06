"use client";

import * as React from "react";
import { Pencil, Save } from "lucide-react";
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
    contact: { id: string; firstName: string; lastName: string; email: string | null; phone: string | null; role: string | null };
    companyId: string;
};

export function EditContactDialog({ clientId, contact, companyId }: Props) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    const [firstName, setFirstName] = React.useState(contact.firstName ?? "");
    const [lastName, setLastName] = React.useState(contact.lastName ?? "");
    const [email, setEmail] = React.useState(contact.email ?? "");
    const [phone, setPhone] = React.useState(contact.phone ?? "");
    const [role, setRole] = React.useState(contact.role ?? "");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!apiBase) {
            toast.error("NEXT_PUBLIC_API_URL manquant");
            return;
        }

        setPending(true);
        try {
            const res = await fetch(`${apiBase}/clients/${clientId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(companyId ? { "x-company-id": companyId } : {}),
                },
                body: JSON.stringify({
                    contacts: {
                        update: [
                            {
                                where: { id: contact.id },
                                data: {
                                    firstName: firstName.trim() || "Contact",
                                    lastName: lastName.trim(),
                                    email: email.trim() || null,
                                    phone: phone.trim() || null,
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
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Téléphone</Label>
                            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
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
