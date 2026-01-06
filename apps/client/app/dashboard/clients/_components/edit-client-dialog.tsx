"use client";

import * as React from "react";
import { ClientSegment, ClientStatus } from "@prisma/client";
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

type Props = {
    clientId: string;
    name: string;
    status: ClientStatus;
    segment: ClientSegment;
    location: string | null;
    primaryEmail: string | null;
    primaryPhone: string | null;
    notes: string | null;
    triggerClassName?: string;
    companyId?: string;
};

const statusOptions: { value: ClientStatus; label: string }[] = [
    { value: ClientStatus.PROSPECT, label: "Prospect" },
    { value: ClientStatus.ACTIVE, label: "Client actif" },
    { value: ClientStatus.INACTIVE, label: "Client inactif" },
];

const segmentOptions: { value: ClientSegment; label: string }[] = [
    { value: ClientSegment.TPE, label: "TPE" },
    { value: ClientSegment.PME, label: "PME" },
    { value: ClientSegment.ETI, label: "ETI" },
    { value: ClientSegment.GE, label: "Grand compte" },
    { value: ClientSegment.OTHER, label: "Autre" },
];

export function EditClientDialog(props: Props) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    const [name, setName] = React.useState(props.name);
    const [status, setStatus] = React.useState<ClientStatus>(props.status);
    const [segment, setSegment] = React.useState<ClientSegment>(props.segment);
    const [location, setLocation] = React.useState(props.location ?? "");
    const [primaryEmail, setPrimaryEmail] = React.useState(props.primaryEmail ?? "");
    const [primaryPhone, setPrimaryPhone] = React.useState(props.primaryPhone ?? "");
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
        setPending(true);
        try {
            const res = await fetch(`${apiBase}/clients/${props.clientId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(props.companyId ? { "x-company-id": props.companyId } : {}),
                },
                body: JSON.stringify({
                    name: name.trim(),
                    status,
                    segment,
                    location: location.trim() || null,
                    primaryEmail: primaryEmail.trim() || null,
                    primaryPhone: primaryPhone.trim() || null,
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
                        <div className="space-y-2">
                            <Label>Email principal</Label>
                            <Input value={primaryEmail} onChange={(e) => setPrimaryEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Téléphone principal</Label>
                            <Input value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} />
                        </div>
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
