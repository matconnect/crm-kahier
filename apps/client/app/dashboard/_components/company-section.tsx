"use client";

import * as React from "react";
import { Clipboard, Crown, Users, Loader2, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        company: {
            id: string;
            name: string;
            code: string;
            legalForm: string | null;
            capitalSocialCents: number | null;
            siren: string | null;
            siret: string | null;
            vatNumber: string | null;
            rcsCity: string | null;
            addressLine1: string | null;
            addressLine2: string | null;
            postalCode: string | null;
            city: string | null;
            country: string | null;
            contactEmail: string | null;
            contactPhone: string | null;
            paymentTerms: string | null;
            latePenaltyRateBps: number | null;
            fixedCompensationCents: number | null;
            createdAt: string;
            users: CompanyUser[];
        };
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
            return { label: "Actif", color: "bg-slate-950/10 text-slate-700 border-emerald-500/20" };
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

function RequiredLabel({ children }: { children: React.ReactNode }) {
    return (
        <Label>
            {children} <span className="text-red-600">*</span>
        </Label>
    );
}

function upgradePlanLabel(planId: "pro" | "enterprise") {
    return planId === "enterprise" ? "Entreprise" : "Pro";
}

// --- Composant Principal ---
export function CompanySection({ userId }: Props) {
    const [company, setCompany] = React.useState<CompanyResponse | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [portalLoading, setPortalLoading] = React.useState(false);
    const [upgradeLoading, setUpgradeLoading] = React.useState(false);
    const [legalSaving, setLegalSaving] = React.useState(false);
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

    async function saveLegalInfo(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const payload = Object.fromEntries(formData.entries());
        setLegalSaving(true);
        try {
            const apiBase = getBrowserApiBase() ?? "";
            const res = await fetch(`${apiBase}/company`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "x-user-id": userId },
                body: JSON.stringify({
                    ...payload,
                    capitalSocialCents: payload.capitalSocialCents ? Number(payload.capitalSocialCents) : null,
                    latePenaltyRateBps: payload.latePenaltyRateBps ? Number(payload.latePenaltyRateBps) : null,
                    fixedCompensationCents: payload.fixedCompensationCents ? Number(payload.fixedCompensationCents) : 4000,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error ?? "Impossible d’enregistrer les informations légales.");
            setCompany((current) => (current && !("error" in current) ? { ...current, company: { ...current.company, ...data.company } } : current));
            toast.success("Informations légales mises à jour.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur inattendue");
        } finally {
            setLegalSaving(false);
        }
    }

    return (
        <div>
            <div>
                <CardTitle className="text-lg">Organisation</CardTitle>
            </div>
            <div className="space-y-8 mt-4">

                {/* Section : Code d'invitation */}
                <section className="space-y-2">
                    <h3 className="text-sm font-semibold leading-none">Code d&apos;invitation</h3>
                    <p className="text-sm text-muted-foreground">
                        Partagez ce code pour permettre à vos collaborateurs de rejoindre l&apos;organisation.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex h-11 min-w-[240px] flex-1 items-center rounded-lg border border-input bg-background px-3">
                            <span className="font-mono text-[17px] ">{companyData.code}</span>
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

                <section className="space-y-4">
                    <div>
                        <h3 className="text-sm font-semibold leading-none">Informations légales pour devis et factures</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            <span className="text-red-600">*</span> Champ obligatoire
                        </p>
                    </div>
                    <form className="grid gap-4 md:grid-cols-2" onSubmit={saveLegalInfo}>
                        <div className="space-y-2">
                            <RequiredLabel>Raison sociale</RequiredLabel>
                            <Input
                                name="name"
                                defaultValue={companyData.name}
                                className={!companyData.name ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel>Forme juridique</RequiredLabel>
                            <Input
                                name="legalForm"
                                defaultValue={companyData.legalForm ?? ""}
                                placeholder="SAS, SARL, EI..."
                                className={!companyData.legalForm ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Capital social (€ centimes)</Label>
                            <Input name="capitalSocialCents" defaultValue={companyData.capitalSocialCents ?? ""} inputMode="numeric" />
                        </div>
                        <div className="space-y-2">
                            <Label>SIREN</Label>
                            <Input name="siren" defaultValue={companyData.siren ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel>SIRET</RequiredLabel>
                            <Input
                                name="siret"
                                defaultValue={companyData.siret ?? ""}
                                className={!companyData.siret ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>TVA intracom</Label>
                            <Input
                                name="vatNumber"
                                defaultValue={companyData.vatNumber ?? ""}
                                placeholder="Laisser vide si non concerné"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ville RCS</Label>
                            <Input name="rcsCity" defaultValue={companyData.rcsCity ?? ""} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email de contact</Label>
                            <Input name="contactEmail" defaultValue={companyData.contactEmail ?? ""} type="email" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <RequiredLabel>Adresse</RequiredLabel>
                            <Input
                                name="addressLine1"
                                defaultValue={companyData.addressLine1 ?? ""}
                                placeholder="Adresse"
                                className={!companyData.addressLine1 ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Complément d’adresse</Label>
                            <Input name="addressLine2" defaultValue={companyData.addressLine2 ?? ""} placeholder="Bâtiment, étage..." />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel>Code postal</RequiredLabel>
                            <Input
                                name="postalCode"
                                defaultValue={companyData.postalCode ?? ""}
                                className={!companyData.postalCode ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel>Ville</RequiredLabel>
                            <Input
                                name="city"
                                defaultValue={companyData.city ?? ""}
                                className={!companyData.city ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel>Pays</RequiredLabel>
                            <Input
                                name="country"
                                defaultValue={companyData.country ?? ""}
                                className={!companyData.country ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Téléphone de contact</Label>
                            <Input name="contactPhone" defaultValue={companyData.contactPhone ?? ""} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <RequiredLabel>Conditions de paiement</RequiredLabel>
                            <Input
                                name="paymentTerms"
                                defaultValue={companyData.paymentTerms ?? ""}
                                placeholder="Paiement à 30 jours fin de mois..."
                                className={!companyData.paymentTerms ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Pénalités de retard (basis points)</Label>
                            <Input name="latePenaltyRateBps" defaultValue={companyData.latePenaltyRateBps ?? ""} inputMode="numeric" placeholder="1000 = 10%" />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel>Indemnité forfaitaire (centimes)</RequiredLabel>
                            <Input
                                name="fixedCompensationCents"
                                defaultValue={companyData.fixedCompensationCents ?? 4000}
                                inputMode="numeric"
                                className={!companyData.fixedCompensationCents ? "border-red-300 focus-visible:ring-red-100" : undefined}
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button type="submit" disabled={legalSaving} className="gap-2">
                                {legalSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Enregistrer
                            </Button>
                        </div>
                    </form>
                </section>

                {/* Section : Facturation & Abonnement (Admin uniquement) */}
                {viewerRole === "ADMIN" && stripe && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold ">Facturation et abonnement</h3>
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

                        <div className="grid gap-4 rounded-xl border px-4 py-4 md:grid-cols-2 lg:grid-cols-2">
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
                    <h3 className="text-sm font-semibold ">Membres de l&apos;équipe ({companyData.users.length})</h3>
                    <div className="grid gap-2">
                        {companyData.users.map((user) => {
                            const isCreator = user.id === creatorId;
                            const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

                            return (
                                <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-transparent px-2 py-2 transition-colors hover:bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                            {user.role === "ADMIN" ? (
                                                <Crown className="h-4 w-4 text-slate-700" />
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

            </div>
        </div>
    );
}
