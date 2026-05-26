"use client";

import * as React from "react";
import { toast } from "sonner";
import { Link2, RefreshCcw } from "lucide-react";
import { getBrowserApiBase } from "@/lib/public-api-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
    userId: string;
    role: "USER" | "MANAGER" | "ADMIN";
};

type KahierLinkStatus = {
    connection: {
        id: string;
        kahierEstablishmentId: number;
        kahierEstablishmentName: string;
        kahierZoneId: number | null;
        kahierZoneName: string | null;
        kahierUserId: number | null;
        kahierUserLabel: string | null;
        linkedByUserId: string | null;
        linkedAt: string;
        updatedAt: string;
    } | null;
    pendingLink: {
        id: string;
        codePreview: string;
        expiresAt: string;
        createdAt: string;
        createdByUserId: string;
    } | null;
};

// TODO(kahier-link): Réactiver quand la route finale de liaison sera stabilisée.
// Ancienne tentative de fallback conservée ici pour reprise :
// async function fetchWithKahierLinkFallback(
//     apiBase: string,
//     path: "/kahier-link" | "/kahier-link/code",
//     init?: RequestInit,
// ) {
//     const primaryUrl = `${apiBase}${path}`;
//     const primaryRes = await fetch(primaryUrl, init);
//     if (primaryRes.status !== 404) {
//         return primaryRes;
//     }
//
//     const fallbackUrl = `${apiBase}/api${path}`;
//     return fetch(fallbackUrl, init);
// }

export function KahierLinkSection({ userId, role }: Props) {
    const apiBase = getBrowserApiBase();
    const [loading, setLoading] = React.useState(true);
    const [generating, setGenerating] = React.useState(false);
    const [status, setStatus] = React.useState<KahierLinkStatus | null>(null);
    const [latestCode, setLatestCode] = React.useState<string | null>(null);

    const loadStatus = React.useCallback(async () => {
        if (!apiBase || !userId) return;
        // TODO(kahier-link): Réactiver la récupération du statut quand l'intégration est prête.
        setStatus(null);
        setLoading(false);
        return;
        /*
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/kahier-link`, {
                cache: "no-store",
                headers: { "x-user-id": userId },
            });
            const data = (await res.json()) as KahierLinkStatus | { error?: string };
            if (!res.ok) {
                const errorMessage = "error" in data ? data.error : undefined;
                throw new Error(errorMessage || "Impossible de récupérer l'intégration Kahier.");
            }
            setStatus(data as KahierLinkStatus);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible de récupérer l'intégration Kahier.");
        } finally {
            setLoading(false);
        }
        */
    }, [apiBase, userId]);

    React.useEffect(() => {
        void loadStatus();
    }, [loadStatus]);

    async function handleGenerate() {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        // TODO(kahier-link): Réactiver la génération de code quand l'intégration est prête.
        toast.message("Liaison Kahier temporairement désactivée (à reprendre plus tard).");
        return;
        /*
        setGenerating(true);
        try {
            const res = await fetch(`${apiBase}/kahier-link/code`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId,
                },
            });
            const data = (await res.json()) as
                | {
                    code: string;
                    expiresAt: string;
                    pendingLink: KahierLinkStatus["pendingLink"];
                }
                | { error?: string };

            if (!res.ok) {
                const errorMessage = "error" in data ? data.error : undefined;
                throw new Error(errorMessage || "Impossible de générer un code de liaison.");
            }

            setLatestCode((data as { code: string }).code);
            toast.success("Code de liaison Kahier généré.");
            await loadStatus();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible de générer un code de liaison.");
        } finally {
            setGenerating(false);
        }
        */
    }

    const canManage = role !== "USER";

    return (
        <Card className="border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-base">Intégration Kahier</CardTitle>
                    <CardDescription>
                        Générez un code de liaison côté CRM, puis confirmez-le plus tard depuis l&apos;app Kahier.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadStatus()} disabled={loading}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Actualiser
                    </Button>
                    {canManage ? (
                        <Button type="button" size="sm" onClick={() => void handleGenerate()} disabled={generating || loading}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Générer un code
                        </Button>
                    ) : null}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {latestCode ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">Code à usage unique</div>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <div className="font-mono text-lg font-semibold text-emerald-950">{latestCode}</div>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                    await navigator.clipboard.writeText(latestCode);
                                    toast.success("Code copié.");
                                }}
                            >
                                Copier
                            </Button>
                        </div>
                        <p className="mt-2 text-sm text-emerald-800">
                            Ce code n&apos;est affiché qu&apos;une seule fois. Saisissez-le dans l&apos;application Kahier pour terminer la liaison.
                        </p>
                    </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-muted/60 px-4 py-3">
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Connexion active</div>
                        {status?.connection ? (
                            <div className="mt-3 space-y-1 text-sm text-slate-700">
                                <p><span className="font-medium text-slate-950">Établissement :</span> {status.connection.kahierEstablishmentName}</p>
                                <p><span className="font-medium text-slate-950">ID Kahier :</span> {status.connection.kahierEstablishmentId}</p>
                                <p><span className="font-medium text-slate-950">Zone :</span> {status.connection.kahierZoneName ?? "Non définie"}</p>
                                <p><span className="font-medium text-slate-950">Utilisateur Kahier :</span> {status.connection.kahierUserLabel ?? "Non renseigné"}</p>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">Aucune liaison active pour cette entreprise.</p>
                        )}
                    </div>

                    <div className="rounded-lg border border-muted/60 px-4 py-3">
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Code en attente</div>
                        {status?.pendingLink ? (
                            <div className="mt-3 space-y-1 text-sm text-slate-700">
                                <p><span className="font-medium text-slate-950">Code :</span> {status.pendingLink.codePreview}</p>
                                <p><span className="font-medium text-slate-950">Expire le :</span> {new Date(status.pendingLink.expiresAt).toLocaleString("fr-FR")}</p>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">Aucun code de liaison actif.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
