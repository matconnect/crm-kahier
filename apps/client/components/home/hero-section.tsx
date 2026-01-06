import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { STACK_BADGES } from "./constants";
import { DashboardPreview } from "./dashboard-preview";
import type { SessionData } from "./types";

export function HeroSection({ session }: { session: SessionData }) {
    return (
        <section id="hero" className="relative py-14 md:py-20">
            <div className="grid items-center gap-10 md:grid-cols-2">
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                        {STACK_BADGES.map((tech) => (
                            <Badge key={tech} variant="secondary">
                                {tech}
                            </Badge>
                        ))}
                    </div>

                    <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                        Le CRM KAHIER pour centraliser vos clients, projets et opérations.
                    </h1>

                    <p className="text-base text-muted-foreground md:text-lg">
                        Une base solide et évolutive : authentification, rôles, pages modulaires et interface moderne. Ajoutez progressivement vos fonctionnalités
                        jusqu’à un CRM complet.
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
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
                                    <Link href="/login">Se connecter</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {session ? (
                            <span>
                                Connecté en tant que <span className="text-foreground">{session.user?.email}</span>
                            </span>
                        ) : (
                            <span>Configuration rapide, interface claire, et architecture propre.</span>
                        )}
                    </div>
                </div>

                <DashboardPreview />
            </div>
        </section>
    );
}
