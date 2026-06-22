"use client";

import type { ClientSegment, ClientStatus, RevenueSource } from "@/lib/client-enums";
import { MapPin } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiInput } from "@/components/ui/multi-input";
import { UserPicker, type PickerOption } from "@/components/ui/user-picker";

import type { FormState, OwnerOption } from "../types";
import React from "react";

function RequiredLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
    return (
        <Label htmlFor={htmlFor}>
            {children} <span className="text-red-600">*</span>
        </Label>
    );
}

type Props = {
    form: FormState;
    pending: boolean;
    owners: OwnerOption[];
    statusOptions: { value: ClientStatus; label: string }[];
    segmentOptions: { value: ClientSegment; label: string }[];
    revenueSourceOptions: { value: RevenueSource; label: string }[];
    onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

export function ClientInfoCard({ form, pending, owners, statusOptions, segmentOptions, revenueSourceOptions, onChange }: Props) {
    const [ownersOpen, setOwnersOpen] = React.useState(false);
    const [ownersQuery, setOwnersQuery] = React.useState("");
    const ownerOptions: PickerOption[] = owners.map((owner) => ({
        id: owner.id,
        label: owner.label,
        email: owner.email,
    }));

    return (
        <Card className="rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_42px_rgba(28,35,54,0.06)] backdrop-blur-sm transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)]">
            <CardHeader className="space-y-1">
                <CardTitle className="text-base text-slate-950">Informations client</CardTitle>
                <p className="text-xs text-slate-500">Les champs obligatoires sont signalés par *</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="name">Nom du client</RequiredLabel>
                        <Input
                            id="name"
                            placeholder="Ex : ACME Industries"
                            value={form.name}
                            onChange={(e) => onChange("name", e.target.value)}
                            required
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="status">Statut</Label>
                            <Select
                                value={form.status}
                                onValueChange={(value) => onChange("status", value as ClientStatus)}
                                disabled={pending}
                            >
                                <SelectTrigger id="status" className="w-full">
                                    <SelectValue placeholder="Statut" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="segment">Segment</Label>
                            <Select
                                value={form.segment}
                                onValueChange={(value) => onChange("segment", value as ClientSegment)}
                                disabled={pending}
                            >
                                <SelectTrigger id="segment" className="w-full">
                                    <SelectValue placeholder="Segment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {segmentOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="revenue-source">Source de revenu</Label>
                            <Select
                                value={form.revenueSource}
                                onValueChange={(value) => onChange("revenueSource", value as RevenueSource)}
                                disabled={pending}
                            >
                                <SelectTrigger id="revenue-source" className="w-full">
                                    <SelectValue placeholder="Source de revenu" />
                                </SelectTrigger>
                                <SelectContent>
                                    {revenueSourceOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="location">Localisation</Label>
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="location"
                                placeholder="Paris, France"
                                className="pl-9"
                                value={form.location}
                                onChange={(e) => onChange("location", e.target.value)}
                                disabled={pending}
                            />
                        </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="addressLine1">Adresse</Label>
                        <Input
                            id="addressLine1"
                            placeholder="12 rue des Fleurs"
                            value={form.addressLine1}
                            onChange={(e) => onChange("addressLine1", e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="addressLine2">Complément d’adresse</Label>
                        <Input
                            id="addressLine2"
                            placeholder="Bâtiment, étage..."
                            value={form.addressLine2}
                            onChange={(e) => onChange("addressLine2", e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="postalCode">Code postal</Label>
                        <Input
                            id="postalCode"
                            placeholder="75000"
                            value={form.postalCode}
                            onChange={(e) => onChange("postalCode", e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                            id="city"
                            placeholder="Paris"
                            value={form.city}
                            onChange={(e) => onChange("city", e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="country">Pays</Label>
                        <Input
                            id="country"
                            placeholder="France"
                            value={form.country}
                            onChange={(e) => onChange("country", e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="siren">SIREN</Label>
                        <Input
                            id="siren"
                            placeholder="123456789"
                            value={form.siren}
                            onChange={(e) => onChange("siren", e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vatNumber">TVA intracom</Label>
                        <Input
                            id="vatNumber"
                            placeholder="FR..."
                            value={form.vatNumber}
                            onChange={(e) => onChange("vatNumber", e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <MultiInput
                        label="Emails"
                        type="email"
                        placeholder="contact@client.com"
                        values={form.emails}
                        onChange={(values) => onChange("emails", values)}
                        disabled={pending}
                    />
                    <MultiInput
                        label="Téléphones"
                        placeholder="+33 6 12 34 56 78"
                        values={form.phones}
                        onChange={(values) => onChange("phones", values)}
                        disabled={pending}
                    />
                </div>

                <UserPicker
                    label="Assigné à"
                    options={ownerOptions}
                    selectedIds={form.ownerIds}
                    onChange={(ids) => onChange("ownerIds", ids)}
                    placeholder="Sélectionne des gestionnaires"
                    open={ownersOpen}
                    onOpenChange={setOwnersOpen}
                    query={ownersQuery}
                    onQueryChange={setOwnersQuery}
                    emptyMessage="Aucun gestionnaire disponible."
                    searchPlaceholder="Rechercher un gestionnaire..."
                />
            </CardContent>
        </Card>
    );
}
