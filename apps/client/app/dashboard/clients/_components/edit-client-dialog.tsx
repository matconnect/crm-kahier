"use client";

import * as React from "react";
import type { ClientSegment, ClientStatus, RevenueSource } from "@/lib/client-enums";
import { getBrowserApiBase } from "@/lib/public-api-base";
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
import { UserPicker, type PickerOption } from "@/components/ui/user-picker";

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
    revenueSource?: RevenueSource | null;
    ownerIds?: string[];
    triggerClassName?: string;
    currentUserId: string;
};

type OwnerOption = { id: string; label: string; email?: string | null };

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
    { value: "OTHER", label: "AUTRE" },
];

const revenueSourceOptions: { value: RevenueSource; label: string }[] = [
    { value: "REFERRAL", label: "Recommandation" },
    { value: "OUTBOUND", label: "Prospection" },
    { value: "ADS", label: "Publicité" },
    { value: "PARTNER", label: "Partenaire" },
    { value: "UPSELL", label: "Upsell" },
    { value: "OTHER", label: "Autre" },
];

export function EditClientDialog(props: Props) {
    const apiBase = getBrowserApiBase();
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    const [name, setName] = React.useState(props.name);
    const [status, setStatus] = React.useState<ClientStatus>(props.status);
    const [segment, setSegment] = React.useState<ClientSegment>(props.segment);
    const [revenueSource, setRevenueSource] = React.useState<RevenueSource>(props.revenueSource ?? "OTHER");
    const [location, setLocation] = React.useState(props.location ?? "");
    const [emails, setEmails] = React.useState<string[]>(
        props.emails?.length ? props.emails : [props.primaryEmail ?? ""],
    );
    const [phones, setPhones] = React.useState<string[]>(
        props.phones?.length ? props.phones : [props.primaryPhone ?? ""],
    );
    const [notes, setNotes] = React.useState(props.notes ?? "");
    const [ownersOpen, setOwnersOpen] = React.useState(false);
    const [ownersQuery, setOwnersQuery] = React.useState("");
    const [ownerIds, setOwnerIds] = React.useState<string[]>(props.ownerIds ?? []);
    const [owners, setOwners] = React.useState<OwnerOption[]>([]);
    const [ownersLoaded, setOwnersLoaded] = React.useState(false);

    React.useEffect(() => {
        if (!open || ownersLoaded) return;
        let active = true;
        async function loadOwners() {
            try {
                if (!apiBase) throw new Error("NEXT_PUBLIC_API_URL manquant");
                const res = await fetch(`${apiBase}/users`, {
                    headers: props.currentUserId ? { "x-user-id": props.currentUserId } : undefined,
                });
                const data = (await res.json()) as { users?: OwnerOption[]; error?: string };
                if (!res.ok) throw new Error(data.error ?? "Impossible de charger les utilisateurs.");
                if (!active || !data.users) return;
                setOwners(data.users);
                setOwnersLoaded(true);
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        }
        void loadOwners();
        return () => {
            active = false;
        };
    }, [apiBase, open, ownersLoaded, props.currentUserId]);

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
                    revenueSource,
                    location: location.trim() || null,
                    emails: cleanEmails,
                    phones: cleanPhones,
                    primaryEmail: cleanEmails[0] ?? null,
                    primaryPhone: cleanPhones[0] ?? null,
                    notes: notes.trim() || null,
                    ownerIds,
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
                </DialogHeader>
                <form className="space-y-3" onSubmit={onSubmit}>
                    <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input placeholder="Nom du client" value={name} onChange={(e) => setName(e.target.value)} required />
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
                            <Input placeholder="Ville, pays" value={location} onChange={(e) => setLocation(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Source de revenu</Label>
                            <Select value={revenueSource} onValueChange={(v) => setRevenueSource(v as RevenueSource)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir une source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {revenueSourceOptions.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <MultiInput
                            label="Emails"
                            type="email"
                            placeholder="contact@client.com"
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
                        <Label>Notes</Label>
                        <Input placeholder="Notes internes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <UserPicker
                        label="Gestionnaires"
                        options={owners.map((owner) => ({
                            id: owner.id,
                            label: owner.label,
                            email: owner.email,
                        })) as PickerOption[]}
                        selectedIds={ownerIds}
                        onChange={setOwnerIds}
                        placeholder="Sélectionne des gestionnaires"
                        open={ownersOpen}
                        onOpenChange={setOwnersOpen}
                        query={ownersQuery}
                        onQueryChange={setOwnersQuery}
                        emptyMessage="Aucun gestionnaire disponible."
                        searchPlaceholder="Rechercher un gestionnaire..."
                    />
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
