"use client";

import * as React from "react";
import { Clipboard, Crown, Users, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getBrowserApiBase } from "@/lib/public-api-base";

// --- Types ---
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
        stripe: {
            subscriptionType: string;
            stripeCustomerId: string | null;
            stripeSubscriptionId: string | null;
            stripePriceId: string | null;
            stripeSubscriptionStatus: string | null;
            stripePurchasedAt: string | null;
            stripeCurrentPeriodStart: string | null;
            stripeCurrentPeriodEnd: string | null;
        } | null;
        viewerRole: "USER" | "MANAGER" | "ADMIN";
        creatorId: string | null;
    }
    | { error: string };

type Props = { userId: string };

// --- Utilitaires ---
function roleLabel(role: CompanyUser["role"]) {
    if (role === "ADMIN") return "Administrateur";
    if (role === "MANAGER") return "Manager";
    return "Utilisateur";
}

const formatDateTime = (value: string | null) => {
    if (!value) return "Non défini";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Non défini";
    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const planLabel = (value: string) => {
    const plans: Record<string, string> = {
        STARTER_FREE: "Démarrage",
        PRO_MONTHLY: "Pro mensuel",
        PRO_YEARLY: "Pro annuel",
        ENTERPRISE_MONTHLY: "Entreprise mensuel",
        ENTERPRISE_YEARLY: "Entreprise annuel",
    };
    return plans[value] || value;
};

const getStatusConfig = (value: string | null) => {
    if (!value) return { label: "Non défini", color: "bg-muted text-muted-foreground" };
    switch (value) {
        case "active":
        case "paid":
            return { label: "Actif", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
        case "trialing":
            return { label: "Essai", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
        case "past_due":
        case "unpaid":
            return { label: "Impayé / En retard", color: "bg-red-500/10 text-red-600 border-red-500/20" };
        case "canceled":
            return { label: "Résilié", color: "bg-zinc-500/10 text-zinc-600 border-zinc-500/20" };
        default:
            return { label: value, color: "bg-muted text-muted-foreground" };
    }
};

const UPGRADE_PRICING: Record<"pro", { monthly: number; yearly: number }> = {
    pro: { monthly: 29, yearly: 24 },
};

function upgradePlanLabel(planId: "pro" | "enterprise") {
    return planId === "enterprise" ? "Entreprise" : "Pro";
}

// --- Composant Principal ---
export function CompanySection({ userId }: Props) {
    const [company, setCompany] = React.useState<CompanyResponse | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [portalLoading, setPortalLoading] = React.useState(false);
    const [upgradeLoading, setUpgradeLoading] = React.useState(false);
    const [upgradePlanId, setUpgradePlanId] = React.useState<"pro" | "enterprise">("pro");
    const [upgradeBillingCycle, setUpgradeBillingCycle] = React.useState<"monthly" | "yearly">("monthly");
    const selectedPrice = upgradePlanId === "pro" ? UPGRADE_PRICING.pro[upgradeBillingCycle] : null;

    React.useEffect(() => {
        let active = true;
        async function load() {
            try {
                const apiBase = getBrowserApiBase() ?? "";
                const res = await fetch(`${apiBase}/company`, {
                    cache: "no-store",
                    headers: { "x-user-id": userId },
                });
                const data = (await res.json().catch(() => null)) as CompanyResponse | null;
                if (!res.ok || !data) {
                    const message = data && "error" in data ? data.error : `Entreprise indisponible (HTTP ${res.status}).`;
                    throw new Error(message);
                }
                if (active) setCompany(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : "Impossible de récupérer les informations de l'entreprise.";
                if (active) setCompany({ error: message });
            } finally {
                if (active) setLoading(false);
            }
        }
        void load();
        return () => { active = false; };
    }, [userId]);

    // État de chargement (UX améliorée)
    if (loading) {
        return (
            <Card className="border-muted/60 animate-pulse">
                <CardHeader>
                    <div className="h-6 w-32 rounded bg-muted"></div>
                    <div className="h-4 w-64 rounded bg-muted/50 mt-2"></div>
                </CardHeader>
                <CardContent>
                    <div className="h-16 w-full rounded-lg bg-muted/30"></div>
                </CardContent>
            </Card>
        );
    }

    // Gestion des erreurs
    if (!company || "error" in company) {
        return (
            <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="flex items-center gap-3 py-6 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">{company?.error || "Une erreur inconnue est survenue."}</p>
                </CardContent>
            </Card>
        );
    }

    // Restriction d'accès
    if (company.viewerRole === "USER") return null;

    const { company: companyData, stripe, viewerRole, creatorId } = company;

    return (
        <Card className="border-muted/60 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Organisation</CardTitle>
                <CardDescription>Gérez les informations, l&apos;abonnement et les membres de votre entreprise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                {/* Section : Code d'invitation */}
                <section className="space-y-2">
                    <h3 className="text-[22px] font-semibold leading-none">Code d&apos;invitation</h3>
                    <p className="text-sm text-muted-foreground">
                        Partagez ce code pour permettre à vos collaborateurs de rejoindre l&apos;organisation.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-11 min-w-[240px] flex-1 items-center rounded-lg border border-input bg-background px-3">
                            <span className="font-mono text-[17px] tracking-[0.06em]">{companyData.code}</span>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-lg px-4"
                            onClick={async () => {
                                await navigator.clipboard.writeText(companyData.code);
                                toast.success("Code d'établissement copié !");
                            }}
                        >
                            <Clipboard className="mr-2 h-4 w-4" />
                            Copier
                        </Button>
                    </div>
                </section>

                {/* Section : Facturation & Abonnement (Admin uniquement) */}
                {viewerRole === "ADMIN" && stripe && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold tracking-tight">Facturation et abonnement</h3>
                            {stripe.subscriptionType !== "STARTER_FREE" && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={portalLoading}
                                    onClick={async () => {
                                        try {
                                            setPortalLoading(true);
                                            const apiBase = getBrowserApiBase();
                                            if (!apiBase) throw new Error("API URL manquante");
                                            const res = await fetch(`${apiBase}/billing/portal-session`, {
                                                method: "POST",
                                                headers: { "x-user-id": userId },
                                            });
                                            const data = await res.json().catch(() => null);
                                            if (!res.ok || !data?.url) throw new Error(data?.error);
                                            window.location.href = data.url;
                                        } catch (err: any) {
                                            toast.error(err.message || "Impossible d'ouvrir le portail d'abonnement.");
                                        } finally {
                                            setPortalLoading(false);
                                        }
                                    }}
                                >
                                    {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Gérer l&apos;abonnement
                                </Button>
                            )}
                        </div>

                        <div className="grid gap-4 rounded-xl border border-muted/60 px-4 py-4 md:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Offre actuelle</p>
                                <p className="text-sm font-medium">{planLabel(stripe.subscriptionType)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Statut</p>
                                {(() => {
                                    const status = getStatusConfig(stripe.stripeSubscriptionStatus);
                                    return (
                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors ${status.color}`}>
                                            {status.label}
                                        </span>
                                    );
                                })()}
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Date d&apos;achat</p>
                                <p className="text-sm">{formatDateTime(stripe.stripePurchasedAt)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Prochain renouvellement</p>
                                <p className="text-sm">{formatDateTime(stripe.stripeCurrentPeriodEnd)}</p>
                            </div>
                        </div>

                        {/* Upsell si gratuit */}
                        {stripe.subscriptionType === "STARTER_FREE" && (
                            <div className="mt-4 rounded-xl border-2 border-dashed border-muted-foreground/35 bg-muted/20 px-4 py-4">
                                <div className="space-y-1">
                                    <h4 className="text-[26px] font-semibold leading-none">
                                        {upgradePlanId === "enterprise" ? (
                                            <span>Contactez-nous</span>
                                        ) : (
                                            <>
                                                {selectedPrice}€{" "}
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    / mois{upgradeBillingCycle === "yearly" ? ", facturé annuellement" : ""}
                                                </span>
                                            </>
                                        )}
                                    </h4>
                                    <p className="text-sm font-medium">
                                        Passez à {upgradePlanLabel(upgradePlanId)} pour débloquer toutes les fonctionnalités.
                                    </p>
                                </div>
                                <div className="mt-4 flex flex-wrap items-end gap-3">
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-muted-foreground">Forfait</p>
                                        <Select value={upgradePlanId} onValueChange={(v) => setUpgradePlanId(v as "pro" | "enterprise")}>
                                            <SelectTrigger className="h-10 w-[160px] bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pro">Pro</SelectItem>
                                                <SelectItem value="enterprise">Entreprise</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-muted-foreground">Facturation</p>
                                        <Select value={upgradeBillingCycle} onValueChange={(v) => setUpgradeBillingCycle(v as "monthly" | "yearly")}>
                                            <SelectTrigger className="h-10 w-[170px] bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Mensuelle</SelectItem>
                                                <SelectItem value="yearly">Annuelle</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        className="rounded-lg bg-zinc-900 px-5 text-white hover:bg-zinc-800"
                                        disabled={upgradeLoading}
                                        onClick={async () => {
                                            if (upgradePlanId === "enterprise") {
                                                window.location.href = "mailto:contact@kahier.com?subject=Demande%20offre%20Entreprise%20CRM";
                                                return;
                                            }
                                            try {
                                                setUpgradeLoading(true);
                                                const apiBase = getBrowserApiBase();
                                                if (!apiBase) throw new Error("API URL manquante");
                                                const res = await fetch(`${apiBase}/billing/upgrade-session`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json", "x-user-id": userId },
                                                    body: JSON.stringify({ planId: upgradePlanId, billingCycle: upgradeBillingCycle }),
                                                });
                                                const raw = await res.text();
                                                let data: { url?: string; error?: string } | null = null;
                                                if (raw) {
                                                    try {
                                                        data = JSON.parse(raw) as { url?: string; error?: string };
                                                    } catch {
                                                        data = null;
                                                    }
                                                }
                                                if (!res.ok) {
                                                    throw new Error(data?.error || raw || `Upgrade refusé (HTTP ${res.status}).`);
                                                }
                                                if (!data?.url) {
                                                    throw new Error("Lien Stripe introuvable dans la réponse API.");
                                                }
                                                window.location.href = data.url;
                                            } catch (err: any) {
                                                toast.error(err.message || "Impossible de lancer l'upgrade.");
                                            } finally {
                                                setUpgradeLoading(false);
                                            }
                                        }}
                                    >
                                        {upgradeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        {upgradePlanId === "enterprise" ? "Contacter" : "Mettre à niveau"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                <div className="h-px bg-muted/60" /> {/* Séparateur de section */}

                {/* Section : Membres */}
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-tight">Membres de l&apos;équipe ({companyData.users.length})</h3>
                    <div className="grid gap-2">
                        {companyData.users.map((user) => {
                            const isCreator = user.id === creatorId;
                            const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

                            return (
                                <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                            {user.role === "ADMIN" ? (
                                                <Crown className="h-4 w-4 text-amber-500" />
                                            ) : (
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium leading-none">
                                                {fullName || "Utilisateur sans nom"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {viewerRole === "ADMIN" && !isCreator ? (
                                            <Select
                                                value={user.role}
                                                onValueChange={async (nextRole) => {
                                                    try {
                                                        const apiBase = getBrowserApiBase();
                                                        if (!apiBase) throw new Error("API URL manquante");
                                                        const res = await fetch(`${apiBase}/company`, {
                                                            method: "PATCH",
                                                            headers: { "Content-Type": "application/json", "x-user-id": userId },
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
                                                        toast.success("Rôle mis à jour avec succès");
                                                    } catch {
                                                        toast.error("Impossible de mettre à jour le rôle");
                                                    }
                                                }}
                                            >
                                                <SelectTrigger className="h-8 w-[140px] bg-transparent">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ADMIN">Administrateur</SelectItem>
                                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                                    <SelectItem value="USER">Utilisateur</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                                {roleLabel(user.role)} {isCreator && "(Créateur)"}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

            </CardContent>
        </Card>
    );
}
