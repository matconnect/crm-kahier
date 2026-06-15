"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail, User, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const PLAN_PRICING = {
    starter: { label: "Démarrage", monthly: 0, yearly: 0 },
    pro: { label: "Professionnel", monthly: 29, yearly: 24 },
    enterprise: { label: "Entreprise", monthly: 79, yearly: 65 },
} as const;

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const apiBase = React.useMemo(() => {
        const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
        if (configured) return configured.replace(/\/$/, "");
        if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
        return "";
    }, []);

    const parseError = React.useCallback((raw: unknown, fallback: string) => {
        if (raw && typeof raw === "object") {
            const obj = raw as Record<string, unknown>;
            if (typeof obj.error === "string" && obj.error.trim()) return obj.error;
            if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
        }
        return fallback;
    }, []);

    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [mode, setMode] = React.useState<"join" | "create">("join");
    const [companyCode, setCompanyCode] = React.useState("");
    const [companyName, setCompanyName] = React.useState("");
    const [planId, setPlanId] = React.useState<"starter" | "pro" | "enterprise">("starter");
    const [billingCycle, setBillingCycle] = React.useState<"monthly" | "yearly">("monthly");
    const [pending, setPending] = React.useState(false);

    React.useEffect(() => {
        const syncAutofill = () => {
            const firstNameEl = document.getElementById("firstName") as HTMLInputElement | null;
            const lastNameEl = document.getElementById("lastName") as HTMLInputElement | null;
            const emailEl = document.getElementById("email") as HTMLInputElement | null;
            const passwordEl = document.getElementById("password") as HTMLInputElement | null;
            const confirmPasswordEl = document.getElementById("confirmPassword") as HTMLInputElement | null;

            if (firstNameEl?.value) setFirstName(firstNameEl.value);
            if (lastNameEl?.value) setLastName(lastNameEl.value);
            if (emailEl?.value) setEmail(emailEl.value);
            if (passwordEl?.value) setPassword(passwordEl.value);
            if (confirmPasswordEl?.value) setConfirmPassword(confirmPasswordEl.value);
        };

        syncAutofill();
        const timeout = window.setTimeout(syncAutofill, 200);
        return () => window.clearTimeout(timeout);
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }

        setPending(true);

        try {
            if (mode === "create") {
                const res = await fetch(`${apiBase}/billing/register-with-plan`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        password,
                        companyName: companyName.trim(),
                        planId,
                        billingCycle,
                        returnBaseUrl: window.location.origin,
                    }),
                });
                const data = (await res.json().catch(() => null)) as {
                    checkoutUrl?: string | null;
                    requiresCheckout?: boolean;
                    error?: string;
                    message?: string;
                } | null;

                if (!res.ok) {
                    toast.error(parseError(data, `Register + Stripe backend échoué (HTTP ${res.status}).`));
                    setPending(false);
                    return;
                }

                if (data?.requiresCheckout && data.checkoutUrl) {
                    window.location.href = data.checkoutUrl;
                    return;
                }

                setPending(false);
                toast.success("Compte créé avec succès ! Connectez-vous pour continuer.");
                router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                return;
            }

            const registerRes = await fetch(`${apiBase}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    companyCode: companyCode.trim(),
                }),
            });
            const registerData = (await registerRes.json().catch(() => null)) as { error?: string; message?: string } | null;

            if (!registerRes.ok) {
                toast.error(parseError(registerData, `Register backend échoué (HTTP ${registerRes.status}).`));
                setPending(false);
                return;
            }

            setPending(false);
            toast.success("Compte créé avec succès ! Connectez-vous pour continuer.");
            router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } catch {
            toast.error("Une erreur est survenue. Veuillez réessayer plus tard.");
            setPending(false);
        }
    }

    const companyInvalid =
        (mode === "join" && !companyCode.trim()) || (mode === "create" && !companyName.trim());
    const disabled =
        pending || !firstName || !lastName || !email || !password || !confirmPassword || companyInvalid;
    const selectedPlan = PLAN_PRICING[planId];
    const selectedPrice = selectedPlan[billingCycle];
    const monthlyReference = selectedPlan.monthly;
    const yearlyTotal = selectedPlan.yearly * 12;
    const monthlyTotalAnnualized = monthlyReference * 12;
    const yearlySavings = monthlyTotalAnnualized - yearlyTotal;
    const yearlyDiscountPercent =
        monthlyReference > 0 ? Math.round((yearlySavings / monthlyTotalAnnualized) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#eef0f6]">
            <header className="border-b border-white/70 px-6 py-4">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                    <Link href="/" className="text-sm font-semibold uppercase  text-[#2f3344]">
                        KAHIER CRM
                    </Link>
                </div>
            </header>

            <main className="px-6 py-10">
                <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[440px_minmax(0,1fr)] lg:items-center">
                <div className="w-full max-w-md justify-self-center">
                    <Card className="rounded-[28px] border border-white/70 bg-white shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-2xl font-bold  text-[#1f2335]">Créer un compte</CardTitle>
                            <CardDescription className="text-[#6f7488]">
                                Rejoignez votre entreprise ou créez-en une nouvelle.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <form onSubmit={onSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Prénom</Label>
                                    <div className="relative">
                                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input id="firstName" placeholder="Jean" className="pl-9" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Nom</Label>
                                    <div className="relative">
                                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input id="lastName" placeholder="Dupont" className="pl-9" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input id="email" type="email" placeholder="vous@domaine.fr" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-9 pr-10" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-muted">
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <button type="button" onClick={() => setMode("join")} className={`rounded-[1.25rem] border px-3 py-3 text-left text-sm transition ${mode === "join" ? "border-[#cfd5e6] bg-[#f3f6ff] text-[#2f3344]" : "border-slate-200 bg-white text-slate-600"}`}>
                                        Rejoindre une entreprise
                                        <div className="text-xs text-muted-foreground">Avec un code d&apos;invitation</div>
                                    </button>
                                    <button type="button" onClick={() => setMode("create")} className={`rounded-[1.25rem] border px-3 py-3 text-left text-sm transition ${mode === "create" ? "border-[#cfd5e6] bg-[#f3f6ff] text-[#2f3344]" : "border-slate-200 bg-white text-slate-600"}`}>
                                        Créer une entreprise
                                        <div className="text-xs text-muted-foreground">Pour commencer de zéro</div>
                                    </button>
                                </div>

                                {mode === "join" ? (
                                    <div className="space-y-2">
                                        <Label htmlFor="companyCode">Code entreprise</Label>
                                        <div className="relative">
                                            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input id="companyCode" placeholder="CODE123" className="pl-9 uppercase" value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} required />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                                        <div className="relative">
                                            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input id="companyName" placeholder="Ex : Kahier" className="pl-9" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                                        </div>

                                        <Label htmlFor="plan">Abonnement</Label>
                                        <Select value={planId} onValueChange={(value) => setPlanId(value as "starter" | "pro" | "enterprise")}>
                                            <SelectTrigger id="plan" className="w-full">
                                                <SelectValue placeholder="Choisir un abonnement" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="starter">Démarrage</SelectItem>
                                                <SelectItem value="pro">Professionnel</SelectItem>
                                                <SelectItem value="enterprise">Entreprise</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {planId !== "starter" ? (
                                            <>
                                                <Label htmlFor="billingCycle" className="pt-2">Facturation</Label>
                                                <Select value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
                                                    <SelectTrigger id="billingCycle" className="w-full">
                                                        <SelectValue placeholder="Choisir la périodicité" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="monthly">Mensuelle</SelectItem>
                                                        <SelectItem value="yearly">Annuelle</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Plan Commencement: validation ponctuelle via Stripe.</p>
                                        )}

                                        <div className="rounded-xl border border-slate-200 bg-[#f8f9fd] px-3 py-3 text-sm text-slate-700">
                                            <p className="font-medium text-slate-900">Tarif sélectionné : {selectedPlan.label}</p>
                                            {selectedPrice === 0 ? (
                                                <p className="mt-1">0€ HT / mois</p>
                                            ) : billingCycle === "monthly" ? (
                                                <p className="mt-1">{selectedPrice}€ HT / mois</p>
                                            ) : (
                                                <>
                                                    <p className="mt-1">{selectedPrice}€ HT / mois, facturé {yearlyTotal}€ HT / an</p>
                                                    <p className="mt-1 text-emerald-700">
                                                        Réduction annuelle : -{yearlyDiscountPercent}% (vous économisez {yearlySavings}€ HT / an)
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" className="w-full rounded-full border-0 bg-[#111322] text-white hover:bg-[#191d2e] cursor-pointer" disabled={disabled}>
                                    {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : "Créer un compte"}
                                </Button>

                                <p className="text-center text-xs text-muted-foreground">
                                    En créant un compte, vous acceptez nos{" "}
                                    <Link href="/cgu" className="underline">CGU</Link>,{" "}
                                    <Link href="/cgv" className="underline">CGV</Link> et notre{" "}
                                    <Link href="/confidentialite" className="underline">politique de confidentialité</Link>.
                                </p>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-muted" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-muted-foreground">Déjà un compte ?</span>
                                </div>
                            </div>

                            <Button asChild variant="outline" className="w-full rounded-full border border-[#d7dced] bg-white text-[#2f3344] hover:bg-[#f8f9fd]">
                                <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Se connecter</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <section className="hidden rounded-[28px] border border-white/70 bg-[#f8f9fd] p-8 shadow-[0_20px_50px_rgba(29,33,49,0.08)] lg:block">
                    <div className="relative max-w-xl space-y-5">
                        <p className="text-xs font-semibold uppercase  text-[#8f93a9]">Onboarding</p>
                        <h1 className="text-5xl font-bold leading-tight  text-[#1f2335]">Créez votre espace CRM.</h1>
                        <p className="text-base text-[#6f7488]">
                            Rejoignez une entreprise existante ou créez votre structure avec le même style produit que le dashboard.
                        </p>
                    </div>
                </section>
            </div>
            </main>

            <footer className="px-6 pb-8 text-center text-xs text-[#7f859b]">
                <div>© {new Date().getFullYear()} KAHIER CRM</div>
                <div className="mt-2 space-x-2">
                    <Link href="/confidentialite" className="hover:underline">Politique de confidentialité</Link>
                    <span>•</span>
                    <Link href="/mentions-legales" className="hover:underline">Mentions légales</Link>
                    <span>•</span>
                    <Link href="/cgu" className="hover:underline">CGU</Link>
                    <span>•</span>
                    <Link href="/cgv" className="hover:underline">CGV</Link>
                </div>
            </footer>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={null}>
            <RegisterForm />
        </Suspense>
    );
}
