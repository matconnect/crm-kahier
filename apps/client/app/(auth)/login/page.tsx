"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "../actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiBase = React.useMemo(() => {
    const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (configured) return configured.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
    return "";
  }, []);

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

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [checkoutStatusText, setCheckoutStatusText] = React.useState<string | null>(null);
  const [checkoutStatusTone, setCheckoutStatusTone] = React.useState<"success" | "warning" | "error">("success");

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
          const plan = data.planId ? `Plan : ${data.planId}` : null;
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

      toast.success("Connexion réussie. Redirection en cours.");
      const safeUrl = toRelativeUrl(callbackUrl) ?? "/dashboard";
      router.push(safeUrl);
      router.refresh();
    } catch {
      setPending(false);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    }
  }

  const disabled = pending || !email || !password;
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

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
            <Link href={registerHref}>Créer un compte</Link>
          </Button>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px]">
          <section className="rounded-[32px] bg-black px-6 py-8 text-white md:px-8 md:py-10">
            <div className="flex h-full flex-col justify-between gap-10">
              <div className="max-w-2xl">
                <p className="text-sm text-white/55">Connexion</p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight md:text-6xl">
                  Retrouver
                  <br />
                  votre espace.
                </h1>
                <p className="mt-4 max-w-md text-base text-white/70 md:text-lg">
                  Clients, projets, devis, factures.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5">
                <p className="text-sm text-white/55">Accès rapide</p>
                <p className="mt-2 text-2xl font-semibold">Un seul point d’entrée pour le CRM.</p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-black/10 bg-[#f5f5f5] p-5 md:p-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-black">Se connecter</h2>
              <p className="text-sm text-black/55">Accédez à votre tableau de bord.</p>
            </div>

            <div className="mt-6 space-y-5">
              {checkoutStatusText ? (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link href="/forgot-password" className="text-xs text-black/50 hover:text-black">
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-2xl border-black/10 bg-white pl-10 pr-11"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
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

                <Button
                  type="submit"
                  className="h-12 w-full rounded-full bg-black text-white hover:bg-black/90"
                  disabled={disabled}
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="border-t border-black/10 pt-5">
                <p className="text-sm text-black/55">Pas encore de compte ?</p>
                <Button
                  asChild
                  variant="ghost"
                  className="mt-3 h-12 w-full rounded-full border border-black/10 bg-white text-black hover:bg-black/[0.04]"
                >
                  <Link href={registerHref}>Créer un compte</Link>
                </Button>
              </div>

              <p className="text-center text-xs text-black/45">
                En vous connectant, vous acceptez nos{" "}
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
            </div>
          </section>
        </div>
      </main>
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
