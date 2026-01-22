"use client";

import * as React from "react";
import type { ClientSegment, ClientStatus } from "@/lib/client-enums";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiInput } from "@/components/ui/multi-input";

type Props = {
    clientId: string;
    name: string;
    status: ClientStatus;
    segment: ClientSegment;
    location: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
    emails?: string[];
    phones?: string[];
    notes: string | null;
    triggerClassName?: string;
    currentUserId: string;
};

const statusOptions: { value: ClientStatus; label: string }[] = [
    { value: "PROSPECT", label: "Prospect" },
    { value: "ACTIVE", label: "Client actif" },
    { value: "INACTIVE", label: "Client inactif" },
];

const segmentOptions: { value: ClientSegment; label: string }[] = [
    { value: "TPE", label: "TPE" },
    { value: "PME", label: "PME" },
    { value: "ETI", label: "ETI" },
    { value: "GE", label: "Grand compte" },
    { value: "OTHER", label: "Autre" },
];

export function EditClientDialog(props: Props) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    const [name, setName] = React.useState(props.name);
    const [status, setStatus] = React.useState<ClientStatus>(props.status);
    const [segment, setSegment] = React.useState<ClientSegment>(props.segment);
    const [location, setLocation] = React.useState(props.location ?? "");
    const [emails, setEmails] = React.useState<string[]>(
        props.emails?.length ? props.emails : [props.primaryEmail ?? ""],
    );
    const [phones, setPhones] = React.useState<string[]>(
        props.phones?.length ? props.phones : [props.primaryPhone ?? ""],
    );
    const [notes, setNotes] = React.useState(props.notes ?? "");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!apiBase) {
            toast.error("NEXT_PUBLIC_API_URL manquant");
            return;
        }
        if (!name.trim()) {
            toast.error("Le nom est requis");
            return;
        }
        if (!props.currentUserId) {
            toast.error("Utilisateur non authentifié");
            return;
        }
        setPending(true);
        try {
            const cleanEmails = emails.map((value) => value.trim().toLowerCase()).filter(Boolean);
            const cleanPhones = phones.map((value) => value.replace(/\s+/g, "").replace(/[\-().]/g, "").trim()).filter(Boolean);
            if (cleanEmails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
                toast.error("Un email client est invalide");
                return;
            }
            if (cleanPhones.some((phone) => !/^[+]?[\d]{6,}$/.test(phone.replace(/[^\d+]/g, "")))) {
                toast.error("Un téléphone client est invalide");
                return;
            }
            const res = await fetch(`${apiBase}/clients/${props.clientId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": props.currentUserId,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    status,
                    segment,
                    location: location.trim() || null,
                    emails: cleanEmails,
                    phones: cleanPhones,
                    primaryEmail: cleanEmails[0] ?? null,
                    primaryPhone: cleanPhones[0] ?? null,
                    notes: notes.trim() || null,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error ?? "Impossible de mettre à jour le client");
            toast.success("Client mis à jour");
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
                <Button variant="outline" size="sm" className={["gap-2 text-black", props.triggerClassName ?? ""].filter(Boolean).join(" ")}>
                    <Pencil className="h-4 w-4" />
                    Modifier le client
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le client</DialogTitle>
                    <DialogDescription>Met à jour les informations principales.</DialogDescription>
                </DialogHeader>
                <form className="space-y-3" onSubmit={onSubmit}>
                    <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Segment</Label>
                            <Select value={segment} onValueChange={(v) => setSegment(v as ClientSegment)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un segment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {segmentOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Localisation</Label>
                            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>
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
                        <Label>Notes</Label>
                        <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
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
