"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Mail, MessageSquare, PhoneCall, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const typeOptions = [
    { value: "Email", label: "Email", icon: Mail },
    { value: "Appel", label: "Appel", icon: PhoneCall },
    { value: "Réunion", label: "Réunion", icon: Calendar },
    { value: "Note", label: "Note", icon: MessageSquare },
] as const;

type Props = {
    clientId: string;
    currentUserId: string;
};

export function LogInteraction({ clientId, currentUserId }: Props) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const router = useRouter();
    const [pending, setPending] = React.useState(false);
    const [type, setType] = React.useState<string>("Email");
    const [summary, setSummary] = React.useState("");
    const [occurredAt, setOccurredAt] = React.useState<string>(() => {
        const now = new Date();
        return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
    });

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!type) {
            toast.error("Choisis un type d'interaction.");
            return;
        }
        if (!summary.trim()) {
            toast.error("Ajoute un résumé pour l'interaction.");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur non authentifié.");
            return;
        }

        setPending(true);
        try {
            const res = await fetch(`${apiBase}/clients/${clientId}/interactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": currentUserId,
                },
                body: JSON.stringify({
                    type,
                    summary: summary.trim() || null,
                    occurredAt: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
                    userId: currentUserId,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(data?.error ?? "Impossible d'enregistrer l'interaction");
            }
            toast.success("Interaction enregistrée");
            setSummary("");
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur inattendue";
            toast.error(message);
        } finally {
            setPending(false);
        }
    }

    return (
        <Card className="border-muted/60">
            <CardHeader>
                <CardTitle className="text-base">Nouvelle interaction</CardTitle>
                <CardDescription>Log un email, appel, réunion ou note avec ce client.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-3 sm:grid-cols-3" onSubmit={onSubmit}>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={setType} disabled={pending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir un type" />
                            </SelectTrigger>
                            <SelectContent>
                                {typeOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <div className="inline-flex items-center gap-2">
                                            <opt.icon className="h-4 w-4" />
                                            {opt.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Résumé</Label>
                        <Input
                            placeholder="Ex : Email de relance signé"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Date / heure</Label>
                        <Input
                            type="datetime-local"
                            value={occurredAt}
                            onChange={(e) => setOccurredAt(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="sm:col-span-3 flex justify-end">
                        <Button type="submit" className="gap-2" disabled={pending}>
                            <Send className="h-4 w-4" />
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
