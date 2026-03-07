"use client";

import * as React from "react";
import { Clipboard, Crown, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getBrowserApiBase } from "@/lib/public-api-base";

type CompanyUser = {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: "USER" | "MANAGER" | "ADMIN";
    createdAt: string;
};

type CompanyResponse =
    | {
        company: { id: string; name: string; code: string; createdAt: string; users: CompanyUser[] };
        viewerRole: "USER" | "MANAGER" | "ADMIN";
        creatorId: string | null;
    }
    | { error: string };

type Props = { userId: string };

function roleLabel(role: CompanyUser["role"]) {
    if (role === "ADMIN") return "Administrateur";
    if (role === "MANAGER") return "Manager";
    return "Utilisateur";
}

export function CompanySection({ userId }: Props) {
    const [company, setCompany] = React.useState<CompanyResponse | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let active = true;
        async function load() {
            try {
                const apiBase = getBrowserApiBase();
                if (!apiBase) throw new Error("NEXT_PUBLIC_API_URL manquant");
                const res = await fetch(`${apiBase}/company`, {
                    cache: "no-store",
                    headers: { "x-user-id": userId },
                });
                const data = (await res.json()) as CompanyResponse;
                if (active) setCompany(data);
            } catch {
                if (active) setCompany({ error: "Impossible de récupérer l'entreprise" });
            } finally {
                if (active) setLoading(false);
            }
        }
        void load();
        return () => {
            active = false;
        };
    }, [userId]);

    if (loading) return null;
    if (!company || "error" in company) return null;
    if (company.viewerRole === "USER") return null;

    return (
        <Card className="border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="text-base">Entreprise</CardTitle>
                    <CardDescription>Code à partager et membres de l&apos;organisation.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-muted/60 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">{company.company.name}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Code :</span>
                        <span className="rounded bg-muted px-2 py-1 font-mono text-xs">{company.company.code}</span>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={async () => {
                                await navigator.clipboard.writeText(company.company.code);
                                toast.success("Code d'établissement copié");
                            }}
                        >
                            <Clipboard className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="text-sm font-medium">Membres</div>
                    <div className="space-y-2">
                        {company.company.users.map((user) => {
                            const isCreator = user.id === company.creatorId;
                            return (
                                <div
                                    key={user.id}
                                    className="flex flex-wrap items-center gap-3 rounded-lg border border-muted/60 px-3 py-2 text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        {user.role === "ADMIN" ? (
                                            <Crown className="h-4 w-4 text-amber-500" />
                                        ) : (
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="font-medium">
                                            {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                    <div className="ml-auto flex items-center gap-2">
                                        {company.viewerRole === "ADMIN" ? (
                                            <Select
                                                value={user.role}
                                                disabled={isCreator}
                                                onValueChange={async (nextRole) => {
                                                    try {
                                                        const apiBase = getBrowserApiBase();
                                                        if (!apiBase) throw new Error("NEXT_PUBLIC_API_URL manquant");
                                                        const res = await fetch(`${apiBase}/company`, {
                                                            method: "PATCH",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                "x-user-id": userId,
                                                            },
                                                            body: JSON.stringify({ userId: user.id, role: nextRole }),
                                                        });
                                                        if (!res.ok) throw new Error();
                                                        setCompany((prev) => {
                                                            if (!prev || "error" in prev) return prev;
                                                            return {
                                                                ...prev,
                                                                company: {
                                                                    ...prev.company,
                                                                    users: prev.company.users.map((u) =>
                                                                        u.id === user.id ? { ...u, role: nextRole as CompanyUser["role"] } : u,
                                                                    ),
                                                                },
                                                            };
                                                        });
                                                        toast.success("Rôle mis à jour");
                                                    } catch {
                                                        toast.error("Impossible de mettre à jour le rôle");
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="w-[160px] h-8">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                                    <SelectItem value="USER">Utilisateur</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className="rounded-full bg-muted px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                {roleLabel(user.role)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
