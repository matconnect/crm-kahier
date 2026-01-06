import type { ComponentType, SVGProps } from "react";

import Image from "next/image";
import Link from "next/link";
import { Home, ListChecks, NotebookText, Settings, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutButton";

type AnchorLink = { label: string; href: string };
type DetailLink = { label: string; href: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

type DashboardTopBarProps = {
    subtitle: string;
    anchors: AnchorLink[];
    detailLinks?: DetailLink[];
};

const DEFAULT_DETAIL_LINKS: DetailLink[] = [
    { label: "Clients", href: "/dashboard/clients", icon: Users },
    { label: "Projets", href: "/dashboard/projects", icon: ListChecks },
    { label: "Docs", href: "/dashboard/documents", icon: NotebookText },
];

export function DashboardTopBar({
    subtitle,
    anchors,
    detailLinks = DEFAULT_DETAIL_LINKS,
}: DashboardTopBarProps) {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto max-w-6xl space-y-3 px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Image
                            src="/icons/jwin-1.png"
                            alt="Logo KAHIER"
                            width={32}
                            height={32}
                            className="rounded-lg border"
                            priority
                        />
                        <div className="leading-tight">
                            <div className="text-sm font-semibold">KAHIER</div>
                            <div className="text-xs text-muted-foreground">{subtitle}</div>
                        </div>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild size="sm" variant="ghost" className="gap-2">
                            <Link href="/dashboard">
                                <Home className="h-4 w-4" />
                                Accueil
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="gap-2">
                            <Link href="/dashboard/settings">
                                <Settings className="h-4 w-4" />
                                Paramètres
                            </Link>
                        </Button>
                        <LogoutButton size="sm">Déconnexion</LogoutButton>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <nav className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border px-2 py-1 text-sm md:w-auto md:border-0 md:px-0 md:py-0">
                        {anchors.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="rounded-full px-3 py-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto lg:flex lg:overflow-visible">
                        {detailLinks.map((link) => (
                            <Button key={link.href} asChild variant="ghost" size="sm" className="gap-2 whitespace-nowrap">
                                <Link href={link.href}>
                                    <link.icon className="h-4 w-4" />
                                    {link.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
        </header>
    );
}
