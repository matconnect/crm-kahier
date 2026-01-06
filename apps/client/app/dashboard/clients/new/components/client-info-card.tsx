"use client";

import type { ClientSegment, ClientStatus } from "@/lib/client-enums";
import { Mail, MapPin, Phone, UserRound } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { FormState, OwnerOption } from "../types";

type Props = {
    form: FormState;
    pending: boolean;
    owners: OwnerOption[];
    statusOptions: { value: ClientStatus; label: string }[];
    segmentOptions: { value: ClientSegment; label: string }[];
    onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
};

export function ClientInfoCard({ form, pending, owners, statusOptions, segmentOptions, onChange }: Props) {
    return (
        <Card className="border-muted/60 lg:col-span-2">
            <CardHeader className="space-y-1">
                <CardTitle className="text-base">Informations client</CardTitle>
                <CardDescription>Nom, statut, segment, localisation et coordonnées principales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom du client</Label>
                        <Input
                            id="name"
                            placeholder="Ex : ACME Industries"
                            value={form.name}
                            onChange={(e) => onChange("name", e.target.value)}
                            required
                            disabled={pending}
                        />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
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
                    <div className="space-y-2">
                        <Label htmlFor="primaryEmail">Email principal</Label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="primaryEmail"
                                type="email"
                                placeholder="contact@client.com"
                                className="pl-9"
                                value={form.primaryEmail}
                                onChange={(e) => onChange("primaryEmail", e.target.value)}
                                disabled={pending}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="primaryPhone">Téléphone</Label>
                        <div className="relative">
                            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="primaryPhone"
                                placeholder="+33 6 12 34 56 78"
                                className="pl-9"
                                value={form.primaryPhone}
                                onChange={(e) => onChange("primaryPhone", e.target.value)}
                                disabled={pending}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="ownerId" className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-muted-foreground" />
                        Assigné à
                    </Label>
                    <Select
                        value={form.ownerId}
                        onValueChange={(value) => onChange("ownerId", value)}
                        disabled={pending || owners.length === 0}
                    >
                        <SelectTrigger id="ownerId" className="w-full">
                            <SelectValue placeholder="Sélectionne un responsable" />
                        </SelectTrigger>
                        <SelectContent>
                            {owners.map((owner) => (
                                <SelectItem key={owner.id} value={owner.id}>
                                    {owner.label}
                                    {owner.email ? ` – ${owner.email}` : ""}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
