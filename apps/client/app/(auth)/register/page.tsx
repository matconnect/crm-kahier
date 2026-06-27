"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        toast.success("Compte créé avec succès. Connectez-vous pour continuer.");
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

      const registerData = (await registerRes.json().catch(() => null)) as {
        error?: string;
        message?: string;
      } | null;

      if (!registerRes.ok) {
        toast.error(parseError(registerData, `Register backend échoué (HTTP ${registerRes.status}).`));
        setPending(false);
        return;
      }

      setPending(false);
      toast.success("Compte créé avec succès. Connectez-vous pour continuer.");
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
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
    <div className="min-h-screen bg-white text-black">
      <header className="px-4 pt-4 md:px-6 md:pt-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[28px] border border-black/10 bg-white px-4 py-3 md:px-5">
          <Link href="/" className="text-base font-semibold text-black">
            KAHIER CRM
          </Link>
          <Button
            asChild
            variant="ghost"
            className="rounded-full border border-black/10 bg-white text-black hover:bg-black/[0.04]"
          >
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Se connecter</Link>
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[420px_minmax(0,1.1fr)]">
          <section className="rounded-[32px] border border-black/10 bg-[#f5f5f5] p-5 md:p-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-black">Créer un compte</h1>
              <p className="text-sm text-black/55">Rejoindre une entreprise ou en créer une.</p>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <Input
                      id="firstName"
                      placeholder="Jean"
                      className="h-12 rounded-2xl border-black/10 bg-white pl-10"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <Input
                      id="lastName"
                      placeholder="Dupont"
                      className="h-12 rounded-2xl border-black/10 bg-white pl-10"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@domaine.fr"
                    className="h-12 rounded-2xl border-black/10 bg-white pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-2xl border-black/10 bg-white pl-10 pr-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmation</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-2xl border-black/10 bg-white pl-10 pr-11"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-black/45 hover:bg-black/[0.05]"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode("join")}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    mode === "join"
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black"
                  }`}
                >
                  <div className="text-sm font-medium">Rejoindre</div>
                  <div className={`mt-1 text-xs ${mode === "join" ? "text-white/65" : "text-black/50"}`}>
                    Avec un code entreprise
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    mode === "create"
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black"
                  }`}
                >
                  <div className="text-sm font-medium">Créer</div>
                  <div className={`mt-1 text-xs ${mode === "create" ? "text-white/65" : "text-black/50"}`}>
                    Nouvelle entreprise
                  </div>
                </button>
              </div>

              {mode === "join" ? (
                <div className="space-y-2">
                  <Label htmlFor="companyCode">Code entreprise</Label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <Input
                      id="companyCode"
                      placeholder="CODE123"
                      className="h-12 rounded-2xl border-black/10 bg-white pl-10 uppercase"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-[28px] bg-white p-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l’entreprise</Label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                      <Input
                        id="companyName"
                        placeholder="Ex : Kahier"
                        className="h-12 rounded-2xl border-black/10 bg-white pl-10"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan">Abonnement</Label>
                    <Select
                      value={planId}
                      onValueChange={(value) => setPlanId(value as "starter" | "pro" | "enterprise")}
                    >
                      <SelectTrigger id="plan" className="h-12 rounded-2xl border-black/10 bg-white">
                        <SelectValue placeholder="Choisir un abonnement" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Démarrage</SelectItem>
                        <SelectItem value="pro">Professionnel</SelectItem>
                        <SelectItem value="enterprise">Entreprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {planId !== "starter" ? (
                    <div className="space-y-2">
                      <Label htmlFor="billingCycle">Facturation</Label>
                      <Select
                        value={billingCycle}
                        onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}
                      >
                        <SelectTrigger id="billingCycle" className="h-12 rounded-2xl border-black/10 bg-white">
                          <SelectValue placeholder="Choisir la périodicité" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensuelle</SelectItem>
                          <SelectItem value="yearly">Annuelle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  <div className="rounded-[24px] border border-black/10 bg-[#f5f5f5] px-4 py-4 text-sm text-black/70">
                    <p className="font-medium text-black">Tarif sélectionné : {selectedPlan.label}</p>
                    {selectedPrice === 0 ? (
                      <p className="mt-1">0 € HT / mois</p>
                    ) : billingCycle === "monthly" ? (
                      <p className="mt-1">{selectedPrice} € HT / mois</p>
                    ) : (
                      <>
                        <p className="mt-1">{selectedPrice} € HT / mois, facturé {yearlyTotal} € HT / an</p>
                        <p className="mt-1 text-emerald-700">
                          Réduction annuelle : -{yearlyDiscountPercent}% (économie de {yearlySavings} € HT / an)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="h-12 w-full rounded-full bg-black text-white hover:bg-black/90"
                disabled={disabled}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    Créer un compte
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 border-t border-black/10 pt-5">
              <p className="text-sm text-black/55">Déjà un compte ?</p>
              <Button
                asChild
                variant="ghost"
                className="mt-3 h-12 w-full rounded-full border border-black/10 bg-white text-black hover:bg-black/[0.04]"
              >
                <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>Se connecter</Link>
              </Button>
            </div>

            <p className="mt-5 text-center text-xs text-black/45">
              En créant un compte, vous acceptez nos{" "}
              <Link href="/cgu" className="underline">
                CGU
              </Link>
              ,{" "}
              <Link href="/cgv" className="underline">
                CGV
              </Link>{" "}
              et notre{" "}
              <Link href="/confidentialite" className="underline">
                politique de confidentialité
              </Link>
              .
            </p>
          </section>

          <section className="rounded-[32px] bg-black px-6 py-8 text-white md:px-8 md:py-10">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="max-w-2xl">
                <p className="text-sm text-white/55">Inscription</p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
                  Mettre en place
                  <br />
                  votre espace.
                </h2>
                <p className="mt-4 max-w-md text-base text-white/70 md:text-lg">
                  Une entrée simple, une interface claire, le même langage visuel que le dashboard.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-sm text-white/55">1</p>
                  <p className="mt-2 text-lg font-medium">Créer ou rejoindre</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-sm text-white/55">2</p>
                  <p className="mt-2 text-lg font-medium">Configurer l’espace</p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-4">
                  <p className="text-sm text-white/55">3</p>
                  <p className="mt-2 text-lg font-medium">Ouvrir le CRM</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
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
