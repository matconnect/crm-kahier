import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

import type { SessionData } from "./types";

export function TopBar({ session }: { session: SessionData }) {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/icons/jwin-1.png"
                        alt="Logo KAHIER"
                        width={36}
                        height={36}
                        className="rounded-xl border"
                        priority
                    />
                    <div className="leading-tight">
                        <div className="text-sm font-semibold">KAHIER</div>
                        <div className="text-xs text-muted-foreground">CRM</div>
                    </div>
                </Link>

                <nav className="hidden items-center gap-6 md:flex">
                    <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
                        Fonctionnalités
                    </a>
                    <a href="#organisation" className="text-sm text-muted-foreground hover:text-foreground">
                        Organisation
                    </a>
                    <a href="#cta" className="text-sm text-muted-foreground hover:text-foreground">
                        Démarrer
                    </a>
                </nav>

                <div className="flex items-center gap-2">
                    {session ? (
                        <>
                            <Button asChild className="hidden sm:inline-flex">
                                <Link href="/dashboard">Accéder au dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button asChild variant="ghost" className="hidden sm:inline-flex">
                                <Link href="/login">Connexion</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">
                                    Créer un compte <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
