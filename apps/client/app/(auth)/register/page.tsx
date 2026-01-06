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
import { signIn } from "next-auth/react";
import { toast } from "sonner";

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    //NOTE - Récupération du callbackUrl
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    //SECTION - Champs du formulaire
    const [firstName, setFirstName] = React.useState("");
    const [lastName, setLastName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [mode, setMode] = React.useState<"join" | "create">("join");
    const [companyCode, setCompanyCode] = React.useState("");
    const [companyName, setCompanyName] = React.useState("");
    const [pending, setPending] = React.useState(false);
    //!SECTION - Fin champs du formulaire

    //NOTE - Capture l'autofill navigateur pour activer la touche Entrée
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

    //SECTION - Fonction création de compte
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Les mots de passe ne correspondent pas.");
            return;
        }

        setPending(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                    ...(mode === "join"
                        ? { companyCode: companyCode.trim() }
                        : { companyName: companyName.trim() || undefined }),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error);
                setPending(false);
                return;
            }

            const loginRes = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl,
            });

            setPending(false);

            if (!loginRes || loginRes.error) {
                toast.success("Compte créé avec succès ! Redirection en cours...");
                router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
                return;
            }

            router.push(loginRes.url ?? callbackUrl);
            router.refresh();
        } catch {
            toast.error("Une erreur est survenue. Veuillez réessayer plus tard.");
            setPending(false);
        }
    }
    //!SECTION - Fin fonction création de compte

    //NOTE - Désactivation du bouton si des champs sont vides ou en attente
    const companyInvalid =
        (mode === "join" && !companyCode.trim()) || (mode === "create" && !companyName.trim());
    const disabled =
        pending || !firstName || !lastName || !email || !password || !confirmPassword || companyInvalid;

    //NOTE - Return principal
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <Card className="border-muted/60 shadow-sm">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-2xl">Créer un compte</CardTitle>
                        <CardDescription>
                            Rejoignez votre entreprise ou créez-en une nouvelle.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Prénom</Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="firstName"
                                        placeholder="Jean"
                                        className="pl-9"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Nom</Label>
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="lastName"
                                        placeholder="Dupont"
                                        className="pl-9"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

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
                                <Label htmlFor="password">Mot de passe</Label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-9 pr-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                                <div className="relative">
                                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="pl-9 pr-10"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={() => setMode("join")}
                                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                        mode === "join" ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/30"
                                    }`}
                                >
                                    Rejoindre une entreprise
                                    <div className="text-xs text-muted-foreground">Avec un code d&apos;invitation</div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("create")}
                                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                        mode === "create" ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/30"
                                    }`}
                                >
                                    Créer une entreprise
                                    <div className="text-xs text-muted-foreground">Pour commencer de zéro</div>
                                </button>
                            </div>

                            {mode === "join" ? (
                                <div className="space-y-2">
                                    <Label htmlFor="companyCode">Code entreprise</Label>
                                    <div className="relative">
                                        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="companyCode"
                                            placeholder="CODE123"
                                            className="pl-9 uppercase"
                                            value={companyCode}
                                            onChange={(e) => setCompanyCode(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Demandez à un membre existant de partager le code d&apos;entreprise.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                                    <div className="relative">
                                        <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="companyName"
                                            placeholder="Ex : Kahier"
                                            className="pl-9"
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Un code sera généré et pourra être partagé avec vos collègues.
                                    </p>
                                </div>
                            )}

                            {/* //NOTE - Bouton de création */}
                            <Button type="submit" className="w-full cursor-pointer" disabled={disabled}>
                                {pending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    "Créer un compte"
                                )}
                            </Button>
                        </form>

                        {/* //NOTE - Lien vers la page de connexion */}
                        <div className="text-center text-sm text-muted-foreground">
                            Déjà un compte ?{" "}
                            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="underline">
                                Se connecter
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} KAHIER
                </div>
            </div>
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
