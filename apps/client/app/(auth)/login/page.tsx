"use client";

import * as React from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    //NOTE - Récupération du callbackUrl
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    //SECTION - Champs du formulaire
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [pending, setPending] = React.useState(false);
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

    //SECTION - Fonction de connexion
    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPending(true);

        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl,
        });

        setPending(false);

        if (!res) {
            toast.error("Une erreur est survenue. Veuillez réessayer plus tard.");
            return;
        }

        if (res.error === "CredentialsSignin") {
            toast.error("Email ou mot de passe incorrect.");
            return;
        }

        if (res.url) {
            toast.success("Connecté avec succès ! Redirection en cours...");
        }

        router.push(res.url ?? callbackUrl);
        router.refresh();
    }
    //!SECTION - Fin fonction de connexion

    //NOTE - Désactivation du bouton si des champs sont vides ou en attente
    const disabled = pending || !email || !password;

    //NOTE - Lien vers la page d'inscription avec le callbackUrl pour rediriger après l'inscription (/dashboard)
    const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

    //NOTE - Return principal
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <Card className="border-muted/60 shadow-sm">
                    <CardHeader className="space-y-2">
                        <CardTitle className="text-2xl">Connexion</CardTitle>
                        <CardDescription>Connectez-vous pour accéder à votre espace.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">

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
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:bg-muted"
                                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* //NOTE - Bouton de connexion */}
                            <Button type="submit" className="w-full cursor-pointer" disabled={disabled}>
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
                                <span className="bg-background px-2 text-muted-foreground">Nouveau sur KAHIER - CRM ?</span>
                            </div>
                        </div>

                        {/* //NOTE - Lien vers la page d'inscription */}
                        <Button asChild variant="outline" className="w-full">
                            <Link href={registerHref}>Créer un compte</Link>
                        </Button>

                        <div className="text-center text-xs text-muted-foreground">
                            En vous connectant, vous acceptez les conditions d’utilisation.
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} KAHIER - CRM
                </div>
            </div>
        </div>
    );
}
