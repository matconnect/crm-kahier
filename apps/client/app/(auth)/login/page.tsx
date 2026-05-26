"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { loginAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const apiBase = React.useMemo(() => {
        const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
        if (configured) return configured.replace(/\/$/, "");
        if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
        return "";
    }, []);

    //NOTE - Récupération du callbackUrl
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
    const checkoutResult = searchParams.get("checkout");
    const checkoutSessionId = searchParams.get("session_id");
    const toRelativeUrl = React.useCallback((url: string | null) => {
        if (!url) return null;
        try {
            const target = new URL(url, window.location.origin);
            return `${target.pathname}${target.search}${target.hash}`;
        } catch {
            return null;
        }
    }, []);

    //SECTION - Champs du formulaire
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [pending, setPending] = React.useState(false);
    const [checkoutStatusText, setCheckoutStatusText] = React.useState<string | null>(null);
    const [checkoutStatusTone, setCheckoutStatusTone] = React.useState<"success" | "warning" | "error">("success");
    //!SECTION - Fin champs du formulaire

    //NOTE - Capture l'autofill navigateur pour activer la touche Entrée
    React.useEffect(() => {
        const syncAutofill = () => {
            const emailEl = document.getElementById("email") as HTMLInputElement | null;
            const passwordEl = document.getElementById("password") as HTMLInputElement | null;

            if (emailEl?.value) setEmail(emailEl.value);
            if (passwordEl?.value) setPassword(passwordEl.value);
        };

        syncAutofill();
        const timeout = window.setTimeout(syncAutofill, 200);
        return () => window.clearTimeout(timeout);
    }, []);

    React.useEffect(() => {
        if (!apiBase || checkoutResult !== "success" || !checkoutSessionId) return;
        let cancelled = false;

        (async () => {
            try {
                const res = await fetch(
                    `${apiBase}/billing/checkout-session-status?sessionId=${encodeURIComponent(checkoutSessionId)}`,
                    { cache: "no-store" },
                );
                const data = (await res.json().catch(() => null)) as
                    | {
                        paid?: boolean;
                        email?: string | null;
                        planId?: string | null;
                        billingCycle?: string | null;
                        paymentStatus?: string | null;
                    }
                    | null;

                if (cancelled) return;

                if (!res.ok || !data) {
                    setCheckoutStatusTone("warning");
                    setCheckoutStatusText("Paiement reçu, vérification en cours. Vous pouvez vous connecter.");
                    return;
                }

                if (data.email) setEmail(data.email);
                if (data.paid) {
                    const plan = data.planId ? `Plan: ${data.planId}` : null;
                    const cycle = data.billingCycle ? `(${data.billingCycle})` : null;
                    setCheckoutStatusTone("success");
                    setCheckoutStatusText(
                        `Paiement confirmé${plan ? ` • ${plan}` : ""}${cycle ? ` ${cycle}` : ""}. Connectez-vous pour accéder au CRM.`,
                    );
                } else {
                    setCheckoutStatusTone("warning");
                    setCheckoutStatusText(
                        `Retour Stripe détecté (${data.paymentStatus ?? "statut inconnu"}). Si besoin, réessayez le paiement.`,
                    );
                }
            } catch {
                if (cancelled) return;
                setCheckoutStatusTone("warning");
                setCheckoutStatusText("Retour Stripe détecté. Connectez-vous pour continuer.");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [apiBase, checkoutResult, checkoutSessionId]);

    //SECTION - Fonction de connexion
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPending(true);

        try {
            const result = await loginAction({ email, password });
            setPending(false);

            if (!result.ok) {
                toast.error(result.error ?? "Email ou mot de passe incorrect.");
                return;
            }

            toast.success("Connecté avec succès ! Redirection en cours...");
            const safeUrl = toRelativeUrl(callbackUrl) ?? "/dashboard";
            router.push(safeUrl);
            router.refresh();
        } catch {
            setPending(false);
            toast.error("Une erreur est survenue. Veuillez réessayer plus tard.");
            return;
        }
    }
    //!SECTION - Fin fonction de connexion

    //NOTE - Désactivation du bouton si des champs sont vides ou en attente
    const disabled = pending || !email || !password;

    //NOTE - Lien vers la page d'inscription avec le callbackUrl pour rediriger après l'inscription (/dashboard)
    const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    //NOTE - Return principal
    return (
        <div className="min-h-screen bg-[#eef0f6] px-6 py-10">
            <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1.1fr)_440px] lg:items-center">
                <section className="hidden rounded-[28px] border border-white/70 bg-[#f8f9fd] p-8 shadow-[0_20px_50px_rgba(29,33,49,0.08)] lg:block">
                    <div className="relative max-w-xl space-y-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8f93a9]">Connexion</p>
                        <h1 className="text-5xl font-bold leading-tight tracking-tight text-[#1f2335]">Retrouvez votre espace CRM.</h1>
                        <p className="text-base text-[#6f7488]">
                            Accédez à vos clients, projets et indicateurs dans la même interface que le dashboard.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-[#8f93a9]">Suivi</p>
                                <p className="mt-2 text-xl font-semibold text-[#2f3344]">Clients et interactions</p>
                            </div>
                            <div className="rounded-[1.5rem] border border-[#e1e4ef] bg-white p-4">
                                <p className="text-xs uppercase tracking-[0.22em] text-[#8f93a9]">Accès</p>
                                <p className="mt-2 text-xl font-semibold text-[#2f3344]">Rôles et organisation</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="w-full max-w-md justify-self-center">
                    <Card className="rounded-[28px] border border-white/70 bg-white shadow-[0_20px_50px_rgba(29,33,49,0.08)]">
                        <CardHeader className="space-y-2">
                            <CardTitle className="text-2xl font-bold tracking-tight text-[#1f2335]">Connexion</CardTitle>
                            <CardDescription className="text-[#6f7488]">Connectez-vous pour accéder à votre espace.</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {checkoutStatusText ? (
                                <div
                                    className={`rounded-xl border px-3 py-2 text-sm ${
                                        checkoutStatusTone === "success"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                            : checkoutStatusTone === "error"
                                              ? "border-red-200 bg-red-50 text-red-900"
                                              : "border-amber-200 bg-amber-50 text-amber-900"
                                    }`}
                                >
                                    {checkoutStatusText}
                                </div>
                            ) : null}

                            <form onSubmit={onSubmit} className="space-y-4">
                                <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="vous@domaine.fr"
                                        className="pl-9"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                </div>

                                <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Mot de passe</Label>

                                    <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">
                                        Mot de passe oublié ?
                                    </Link>
                                </div>

                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-9 pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-muted-foreground hover:bg-muted"
                                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                </div>

                                {/* //NOTE - Bouton de connexion */}
                                <Button type="submit" className="w-full rounded-full border-0 bg-[#111322] text-white hover:bg-[#191d2e] cursor-pointer" disabled={disabled}>
                                    {pending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Connexion...
                                        </>
                                    ) : (
                                        "Se connecter"
                                    )}
                                </Button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-muted" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-muted-foreground">Nouveau sur KAHIER CRM ?</span>
                                </div>
                            </div>

                            {/* //NOTE - Lien vers la page d'inscription */}
                            <Button asChild variant="outline" className="w-full rounded-full border border-[#d7dced] bg-white text-[#2f3344] hover:bg-[#f8f9fd]">
                                <Link href={registerHref}>Créer un compte</Link>
                            </Button>

                            <div className="text-center text-xs text-muted-foreground">
                                En vous connectant, vous acceptez les conditions d’utilisation.
                            </div>
                        </CardContent>
                    </Card>

                    <div className="mt-6 text-center text-xs text-[#7f859b]">
                        © {new Date().getFullYear()} KAHIER - CRM
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginForm />
        </Suspense>
    );
}
