import Link from "next/link";
import {
    BriefcaseBusiness,
    CircleDollarSign,
    Cog,
    FileText,
    FolderKanban,
    LayoutDashboard,
    ReceiptText,
    Settings,
    Users,
    Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LogoutButton } from "@/components/LogoutButton";
import type { ActiveMenuKey } from "./types";
import { hasBillingFeature } from "@/lib/subscription";

type SidebarMenuProps = {
    email?: string | null;
    activeClients: number;
    prospects: number;
    interactionsCount: number;
    projectsCount: number;
    devisCount: number;
    facturesCount: number;
    activeMenu: ActiveMenuKey;
    subscriptionType?: string | null;
};

type BadgeSource = "activeClients" | "prospects" | "interactions" | "projects" | "devis" | "factures";

type SidebarItem = {
    key: ActiveMenuKey;
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: BadgeSource;
    premiumFeature?: "finance_dashboard" | "quotes_module" | "invoices_module";
};

type SidebarSection = {
    title: string;
    items: SidebarItem[];
};

const MENU_SECTIONS: SidebarSection[] = [
    {
        title: "Pilotage",
        items: [
            { key: "interactions", href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
            { key: "finance", href: "/dashboard/finance", label: "Finance", icon: CircleDollarSign, premiumFeature: "finance_dashboard" },
        ],
    },
    {
        title: "Commercial",
        items: [
            { key: "clients", href: "/dashboard/clients", label: "Clients", icon: Users, badge: "activeClients" },
            { key: "projects", href: "/dashboard/projects", label: "Projets", icon: FolderKanban, badge: "projects" },
        ],
    },
    {
        title: "Documents",
        items: [
            { key: "devis", href: "/dashboard/devis", label: "Devis", icon: FileText, badge: "devis", premiumFeature: "quotes_module" },
            { key: "factures", href: "/dashboard/factures", label: "Factures", icon: ReceiptText, badge: "factures", premiumFeature: "invoices_module" },
        ],
    },
    {
        title: "Administration",
        items: [{ key: "settings", href: "/dashboard/settings", label: "Paramètres", icon: Cog }],
    },
];

function resolveBadgeValue(
    source: BadgeSource | undefined,
    values: {
        activeClients: number;
        prospects: number;
        interactionsCount: number;
        projectsCount: number;
        devisCount: number;
        facturesCount: number;
    },
) {
    if (source === "activeClients") return values.activeClients;
    if (source === "prospects") return values.prospects;
    if (source === "interactions") return values.interactionsCount;
    if (source === "projects") return values.projectsCount;
    if (source === "devis") return values.devisCount;
    if (source === "factures") return values.facturesCount;
    return undefined;
}

function formatBadge(source: BadgeSource | undefined, value: number | undefined) {
    if (typeof value !== "number" || !source) return undefined;
    if (value <= 0) return undefined;
    if (source === "interactions") return `${value} int.`;
    if (source === "activeClients") return `${value} cli.`;
    if (source === "projects") return `${value} proj.`;
    if (source === "prospects") return `${value} prop.`;
    if (source === "devis") return `${value} dev.`;
    if (source === "factures") return `${value} fac.`;
    return String(value);
}

function MainNavLink({
    href,
    icon: Icon,
    label,
    badge,
    highlighted = false,
    locked = false,
}: {
    href: string;
    icon: LucideIcon;
    label: string;
    badge?: string | number;
    highlighted?: boolean;
    locked?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition ${
                highlighted
                    ? "bg-[#f0f2f7] text-[#10121a]"
                    : locked
                      ? "text-[#9298a8] hover:bg-[#f3f5fa]"
                      : "text-[#272b38] hover:bg-[#f3f5fa]"
            }`}
        >
            <span className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${highlighted ? "text-[#10121a]" : "text-[#6f7686]"}`} />
                {label}
            </span>
            {locked ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-[#dfe3ec] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-[#6d738a]">
                    <Lock className="h-3 w-3" />
                    Pro
                </span>
            ) : badge !== undefined ? (
                <span className="rounded-lg border border-[#dfe3ec] bg-white px-2 py-0.5 text-xs font-semibold text-[#444a57]">{badge}</span>
            ) : null}
        </Link>
    );
}

export function SidebarMenu({
    email,
    activeClients,
    prospects,
    interactionsCount,
    projectsCount,
    devisCount,
    facturesCount,
    activeMenu,
    subscriptionType,
}: SidebarMenuProps) {
    const badgeValues = { activeClients, prospects, interactionsCount, projectsCount, devisCount, facturesCount };

    return (
        <aside className="border-b border-[#e6e9f0] bg-white p-4 lg:border-r lg:border-b-0 lg:p-5">
            <div className="flex items-center justify-between px-3 py-3">
                <p className="text-4xl font-bold leading-none text-[#11131d]">Kahier</p>
                <div className="rounded-xl border border-[#e6e9f0] bg-[#fafbfe] p-2.5 text-[#798294]">
                    <BriefcaseBusiness className="h-5 w-5" />
                </div>
            </div>

            <div className="mt-6">
                <div className="space-y-6">
                    {MENU_SECTIONS.map((section) => (
                        <div key={section.title}>
                            <p className="px-3 text-xs font-medium uppercase text-[#a0a6b4]">{section.title}</p>
                            <div className="mt-3 space-y-1">
                                {section.items.map((item) => {
                                    const rawBadge = resolveBadgeValue(item.badge, badgeValues);
                                    const badge = formatBadge(item.badge, typeof rawBadge === "number" ? rawBadge : undefined);
                                    const locked = item.premiumFeature
                                        ? !hasBillingFeature(subscriptionType ?? "STARTER_FREE", item.premiumFeature)
                                        : false;

                                    return (
                                        <MainNavLink
                                            key={item.key}
                                            href={locked ? "/dashboard/settings?upgrade=1" : item.href}
                                            icon={item.icon}
                                            label={item.label}
                                            badge={badge}
                                            locked={locked}
                                            highlighted={activeMenu === item.key}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 rounded-2xl border border-[#e6e9f0] bg-[#fbfcff] p-4">
                <p className="text-xs uppercase text-[#9aa0af]">Compte</p>
                <p className="mt-2 truncate text-sm font-semibold text-[#2f3344]">{email ?? "Utilisateur"}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                    <Link
                        href="/dashboard/settings"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3ec] bg-white px-3 py-2 text-xs font-semibold text-[#2f3344]"
                    >
                        <Settings className="h-3.5 w-3.5" />
                        Gérer
                    </Link>
                    <LogoutButton size="sm">Déconnexion</LogoutButton>
                </div>
            </div>
        </aside>
    );
}
