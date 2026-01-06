import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { SessionData } from "./types";

export function CtaSection({ session }: { session: SessionData }) {
    return (
        <section id="cta" className="py-14 md:py-18">
            <Card className="border-muted/60">
                <CardContent className="flex flex-col items-start justify-between gap-6 p-8 md:flex-row md:items-center">
                    <div className="space-y-2">
                        <div className="text-xl font-semibold">Prêt à démarrer ?</div>
                        <div className="text-sm text-muted-foreground">
                            {session
                                ? "Accédez à votre espace et commencez à structurer vos données."
                                : "Créez votre compte et accédez au dashboard en quelques secondes."}
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                        {session ? (
                            <>
                                <Button asChild size="lg">
                                    <Link href="/dashboard">
                                        Accéder au dashboard <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="#features">Voir les fonctionnalités</Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild size="lg">
                                    <Link href="/register">
                                        Créer un compte <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button asChild size="lg" variant="outline">
                                    <Link href="/login">Connexion</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            <footer className="py-10 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} KAHIER — CRM</footer>
        </section>
    );
}
