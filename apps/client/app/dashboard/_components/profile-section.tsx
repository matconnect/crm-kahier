"use client";

import * as React from "react";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { getBrowserApiBase } from "@/lib/public-api-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileResponse =
    | {
        user: { id: string; email: string; firstName: string | null; lastName: string | null };
    }
    | { error: string };

type Props = { userId: string; email: string; initialFirstName?: string; initialLastName?: string };

export function ProfileSection({ userId, email: initialEmail, initialFirstName = "", initialLastName = "" }: Props) {
    const [loading, setLoading] = React.useState(true);
    const [saving, setSaving] = React.useState(false);
    const [firstName, setFirstName] = React.useState(initialFirstName);
    const [lastName, setLastName] = React.useState(initialLastName);
    const [password, setPassword] = React.useState("");
    const [passwordConfirm, setPasswordConfirm] = React.useState("");
    const [email, setEmail] = React.useState(initialEmail);
    const [emailConfirm, setEmailConfirm] = React.useState(initialEmail);

    React.useEffect(() => {
        let active = true;

        async function fetchProfile(attempt = 1): Promise<ProfileResponse> {
            const apiBase = getBrowserApiBase() ?? "";
            const res = await fetch(`${apiBase}/profile`, { headers: { "x-user-id": userId } });
            const data = (await res.json()) as ProfileResponse;
            if (res.ok && !("error" in data)) return data;
            if (attempt < 2) {
                await new Promise((resolve) => setTimeout(resolve, 250));
                return fetchProfile(attempt + 1);
            }
            throw new Error("error" in data ? data.error : "Impossible de charger le profil");
        }

        async function load() {
            try {
                const data = await fetchProfile();
                if (active) {
                    setFirstName(data.user.firstName ?? "");
                    setLastName(data.user.lastName ?? "");
                    setEmail(data.user.email);
                    setEmailConfirm(data.user.email);
                }
            } catch {
                toast.error("Impossible de charger le profil");
            } finally {
                if (active) setLoading(false);
            }
        }
        void load();
        return () => {
            active = false;
        };
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password && password !== passwordConfirm) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }
        if (email.trim() !== emailConfirm.trim()) {
            toast.error("Les adresses email ne correspondent pas.");
            return;
        }
        setSaving(true);
        try {
            const apiBase = getBrowserApiBase() ?? "";
            const res = await fetch(`${apiBase}/profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-user-id": userId },
                body: JSON.stringify({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    ...(password ? { password } : {}),
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error ?? "Impossible de sauvegarder");
            toast.success("Profil mis à jour");
            setPassword("");
            setPasswordConfirm("");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur inattendue");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return null;

    return (
        <Card className="border-muted/60">
            <CardHeader>
                <CardTitle className="text-base">Profil</CardTitle>
                <CardDescription>Mettez à jour votre nom, email et mot de passe.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
                    <div className="space-y-2">
                        <Label>Prénom</Label>
                        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Nouvel email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Confirmer l&apos;email</Label>
                        <Input type="email" value={emailConfirm} onChange={(e) => setEmailConfirm(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Nouveau mot de passe</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Confirmer</Label>
                        <Input
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <Button type="submit" disabled={saving} className="gap-2">
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            <User className="h-4 w-4" />
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
