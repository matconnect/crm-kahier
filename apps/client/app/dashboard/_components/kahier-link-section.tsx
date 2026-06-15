"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";
import { getBrowserApiBase } from "@/lib/public-api-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        kahierApiKey: string | null;
        hasApiKey: boolean;
        linkedByUserId: string | null;
        linkedAt: string;
        updatedAt: string;
    } | null;
    pendingLink: null;
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
    const [savingApiKey, setSavingApiKey] = React.useState(false);
    const [loadingScopes, setLoadingScopes] = React.useState(false);
    const [status, setStatus] = React.useState<KahierLinkStatus | null>(null);
    const [apiKeyInput, setApiKeyInput] = React.useState("");
    const [scopes, setScopes] = React.useState<{ id: number; label: string; description: string; scopes: string[] }[]>([]);
    const [scopesError, setScopesError] = React.useState<string | null>(null);
    const scopesRequestRef = React.useRef<{ inFlight: boolean; key: string; lastAt: number }>({
        inFlight: false,
        key: "",
        lastAt: 0,
    });
    const saveRequestRef = React.useRef(false);

    const hasSavedApiKey = status?.connection?.hasApiKey === true;

    const loadStatus = React.useCallback(async () => {
        if (!apiBase || !userId) {
            setLoading(false);
            return;
        }
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
            const typed = data as KahierLinkStatus;
            setStatus(typed);
            const key = typed.connection?.kahierApiKey ?? "";
            setApiKeyInput(key);
            if (key) {
                window.localStorage.setItem("kahier_api_key", key);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible de récupérer l'intégration Kahier.");
        } finally {
            setLoading(false);
        }
    }, [apiBase, userId]);

    React.useEffect(() => {
        void loadStatus();
    }, [loadStatus]);

    async function loadScopesWithKey(apiKey: string, options?: { silentSuccess?: boolean }) {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return false;
        }
        const normalizedApiKey = apiKey.trim();
        if (!normalizedApiKey) {
            toast.error("Saisis d'abord une clé API.");
            return false;
        }
        const now = Date.now();
        const requestState = scopesRequestRef.current;
        if (requestState.inFlight && requestState.key === normalizedApiKey) {
            return false;
        }
        if (requestState.key === normalizedApiKey && now - requestState.lastAt < 4000) {
            return false;
        }
        scopesRequestRef.current = { inFlight: true, key: normalizedApiKey, lastAt: requestState.lastAt };
        setLoadingScopes(true);
        setScopesError(null);
        try {
            const res = await fetch(`${apiBase}/kahier/scopes`, {
                headers: {
                    "x-api-key": normalizedApiKey,
                },
            });
            const data = (await res.json().catch(() => null)) as
                | { scopes?: { id: number; label: string; description: string; scopes: string[] }[]; error?: string }
                | null;
            if (!res.ok || !data?.scopes) {
                throw new Error(data?.error ?? "Impossible de récupérer les scopes.");
            }
            setScopes(data.scopes);
            if (!options?.silentSuccess) {
                toast.success("Autorisations API récupérées.");
            }
            return true;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Impossible de récupérer les scopes.";
            setScopesError(message);
            toast.error(message);
            return false;
        } finally {
            scopesRequestRef.current = { inFlight: false, key: normalizedApiKey, lastAt: Date.now() };
            setLoadingScopes(false);
        }
    }

    async function handleSaveApiKey() {
        if (saveRequestRef.current) {
            return;
        }
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        if (!apiKeyInput.trim()) {
            toast.error("Saisis une clé API Kahier.");
            return;
        }

        saveRequestRef.current = true;
        setSavingApiKey(true);
        try {
            const normalizedApiKey = apiKeyInput.trim();
            const res = await fetch(`${apiBase}/kahier-link/api-key`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId,
                },
                body: JSON.stringify({ apiKey: normalizedApiKey }),
            });
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) {
                throw new Error(data?.error ?? "Impossible d'enregistrer la clé API.");
            }
            window.localStorage.setItem("kahier_api_key", normalizedApiKey);
            toast.success("Clé API Kahier enregistrée.");
            await loadStatus();
            // Auto-test unique after save. Retest remains manual via button.
            await loadScopesWithKey(normalizedApiKey, { silentSuccess: true });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer la clé API.");
        } finally {
            saveRequestRef.current = false;
            setSavingApiKey(false);
        }
    }

    async function handleDeleteApiKey() {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        if (!window.confirm("Supprimer la clé API Kahier enregistrée ?")) {
            return;
        }

        setSavingApiKey(true);
        try {
            const res = await fetch(`${apiBase}/kahier-link/api-key`, {
                method: "DELETE",
                headers: {
                    "x-user-id": userId,
                },
            });
            const data = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) {
                throw new Error(data?.error ?? "Impossible de supprimer la clé API.");
            }
            window.localStorage.removeItem("kahier_api_key");
            setApiKeyInput("");
            setScopes([]);
            setScopesError(null);
            toast.success("Clé API Kahier supprimée.");
            await loadStatus();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible de supprimer la clé API.");
        } finally {
            setSavingApiKey(false);
        }
    }

    async function handleLoadScopes() {
        await loadScopesWithKey(apiKeyInput, { silentSuccess: false });
    }

    const canManage = role !== "USER";

    return (
        <Card className="border-muted/60">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle className="text-base">Intégration Kahier</CardTitle>
                    <CardDescription>
                        Renseignez uniquement la clé API de l&apos;établissement Kahier pour activer les requêtes.
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadStatus()} disabled={loading}>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Actualiser
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-lg border border-muted/60 px-4 py-3">
                    <div className="space-y-3">
                        <div className="text-xs font-medium uppercase text-muted-foreground">Statut clé API établissement</div>
                        {hasSavedApiKey ? (
                            <p className="text-sm text-slate-700">Clé API enregistrée et masquée.</p>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="kahier-api-key">x-api-key</Label>
                                <Input
                                    id="kahier-api-key"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="Saisir la clé API Kahier de l'établissement"
                                    disabled={!canManage || savingApiKey}
                                />
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {!hasSavedApiKey ? (
                                <Button
                                    type="button"
                                    onClick={() => void handleSaveApiKey()}
                                    disabled={!canManage || savingApiKey || loadingScopes}
                                >
                                    Enregistrer la clé
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void handleLoadScopes()}
                                disabled={!canManage || loadingScopes || !apiKeyInput.trim()}
                            >
                                {hasSavedApiKey ? "Tester l'API" : "Tester l'API"}
                            </Button>
                            {hasSavedApiKey ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => void handleDeleteApiKey()}
                                    disabled={!canManage || savingApiKey}
                                >
                                    Supprimer la clé
                                </Button>
                            ) : null}
                        </div>
                        {scopesError ? <p className="text-xs text-amber-700">{scopesError}</p> : null}
                        {scopes.length > 0 ? (
                            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                                <p className="mb-3 font-medium text-slate-900">Permissions API ({scopes.length})</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {scopes.map((scope) => (
                                        <article key={scope.id} className="rounded-lg border border-slate-200 bg-white p-3">
                                            <p className="text-sm font-semibold text-slate-900">{scope.label}</p>
                                            <p className="mt-1 text-xs text-slate-500">{scope.description}</p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
