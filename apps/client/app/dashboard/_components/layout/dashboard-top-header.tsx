"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Command, MessageSquareText, Plus, Search, Users, FolderKanban } from "lucide-react";
import type { ClientSearchItem, InteractionItem, ProjectSearchItem } from "../shared/types";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

import { formatNowLabelAt, getGreetingAt } from "../shared/formatters";

type DashboardTopHeaderProps = {
    firstName: string;
    searchValue?: string;
    searchClients?: ClientSearchItem[];
    searchInteractions?: InteractionItem[];
    searchProjects?: ProjectSearchItem[];
    mobileSidebar?: ReactNode;
};

export function DashboardTopHeader({
    firstName,
    searchValue,
    searchClients,
    searchInteractions,
    searchProjects,
    mobileSidebar,
}: DashboardTopHeaderProps) {
    const router = useRouter();
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const [query, setQuery] = useState(searchValue ?? "");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [now, setNow] = useState(() => new Date());
    const [isMacLike, setIsMacLike] = useState(false);

    useEffect(() => {
        setQuery(searchValue ?? "");
    }, [searchValue]);

    useEffect(() => {
        setIsMacLike(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
    }, []);

    useEffect(() => {
        if (!isSearchOpen) return;

        const timer = window.setTimeout(() => {
            searchInputRef.current?.focus();
            searchInputRef.current?.select();
        }, 10);

        return () => window.clearTimeout(timer);
    }, [isSearchOpen]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const element = document.getElementById("dashboard-top-header");
        if (!element) return;

        const updateHeight = () => {
            document.documentElement.style.setProperty("--dashboard-top-header-height", `${element.offsetHeight}px`);
        };

        updateHeight();

        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(updateHeight);
            observer.observe(element);
            window.addEventListener("resize", updateHeight);
            return () => {
                observer.disconnect();
                window.removeEventListener("resize", updateHeight);
            };
        }

        window.addEventListener("resize", updateHeight);
        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;

            const target = event.target;
            const isEditable =
                target instanceof HTMLElement &&
                (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

            if (isEditable && target === searchInputRef.current) return;

            event.preventDefault();
            setIsSearchOpen(true);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmed = query.trim();
        const target = trimmed ? `/dashboard?q=${encodeURIComponent(trimmed)}` : "/dashboard";
        setIsSearchOpen(false);
        router.push(target);
    }

    const hasSearchData =
        searchClients !== undefined ||
        searchInteractions !== undefined ||
        searchProjects !== undefined;

    const searchResults = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return { clients: [], interactions: [], projects: [], total: 0 };

        const clients = (searchClients ?? [])
            .filter((item) => item.name.toLowerCase().includes(normalized))
            .slice(0, 5)
            .map((item) => ({
                id: item.id,
                label: item.name,
                href: `/dashboard/clients/${item.id}`,
                meta: `${item.interactionsCount} interaction(s)`,
            }));

        const interactions = (searchInteractions ?? [])
            .filter((item) => `${item.clientName} ${item.summary} ${item.type} ${item.badge}`.toLowerCase().includes(normalized))
            .slice(0, 5)
            .map((item) => ({
                id: item.id,
                label: item.clientName,
                href: `/dashboard/clients/${item.clientId}`,
                meta: item.summary,
            }));

        const projects = (searchProjects ?? [])
            .filter((item) => `${item.name} ${item.description} ${item.clientName}`.toLowerCase().includes(normalized))
            .slice(0, 5)
            .map((item) => ({
                id: item.id,
                label: item.name,
                href: `/dashboard/projects/${item.id}`,
                meta: item.description || item.clientName,
            }));

        const total = clients.length + interactions.length + projects.length;
        return { clients, interactions, projects, total };
    }, [query, searchClients, searchInteractions, searchProjects]);

    const upcomingInteractions = useMemo(() => {
        const nowTs = now.getTime();
        return (searchInteractions ?? [])
            .map((item) => ({ ...item, ts: new Date(item.occurredAt).getTime() }))
            .filter((item) => Number.isFinite(item.ts) && item.ts >= nowTs)
            .sort((a, b) => a.ts - b.ts)
            .slice(0, 3);
    }, [now, searchInteractions]);

    const nextInteraction = upcomingInteractions[0];
    const upcomingMore = upcomingInteractions.slice(1, 8);

    return (
        <div id="dashboard-top-header" className="sticky top-0 z-50 border-b border-[#e6e9f0] bg-white/95 px-4 py-4 backdrop-blur md:px-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-start gap-3">
                        {mobileSidebar}
                        <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-[#141722]">{getGreetingAt(now)}, {firstName}</p>
                            <p className="text-xs text-[#8b91a1]">{formatNowLabelAt(now)}</p>
                        </div>
                    </div>
                    {nextInteraction ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-[#e8fbf8] px-2.5 py-1 text-[11px] font-semibold text-[#1b9b8f]">
                                À venir
                            </span>
                            <Link
                                href={`/dashboard/clients/${nextInteraction.clientId}`}
                                className="rounded-lg border border-[#e4e7ef] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4a4f67] hover:bg-[#f6f8fc]"
                            >
                                {new Date(nextInteraction.occurredAt).toLocaleString("fr-FR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })} · {nextInteraction.clientName}
                            </Link>
                            {upcomingInteractions.length > 1 ? (
                                <details className="relative">
                                    <summary className="cursor-pointer list-none text-[11px] font-medium text-[#8f93a9] marker:content-none hover:text-[#4a4f67]">
                                        +{upcomingInteractions.length - 1} à venir
                                    </summary>
                                    <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[320px] rounded-2xl border border-[#dfe3ef] bg-white p-2 shadow-[0_18px_45px_rgba(29,33,49,0.16)]">
                                        <p className="px-2 py-1 text-[11px] font-semibold uppercase text-[#9aa0b5]">
                                            Interactions à venir
                                        </p>
                                        <div className="max-h-[240px] space-y-1 overflow-auto">
                                            {upcomingMore.map((item) => (
                                                <Link
                                                    key={`upcoming-${item.id}`}
                                                    href={`/dashboard/clients/${item.clientId}`}
                                                    className="block rounded-xl px-2 py-2 hover:bg-[#f6f8fc]"
                                                >
                                                    <p className="text-sm font-semibold text-[#2f3344]">{item.clientName}</p>
                                                    <p className="truncate text-xs text-[#7c8298]">
                                                        {new Date(item.occurredAt).toLocaleString("fr-FR", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}{" "}
                                                        · {item.summary}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </details>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <div className="flex w-full items-center gap-3 md:w-auto">
                    <div className="relative flex-1 md:min-w-[360px] lg:min-w-[420px]">
                        <button
                            type="button"
                            onClick={() => setIsSearchOpen(true)}
                            className="flex h-12 w-full items-center gap-3 rounded-xl border border-[#dde2eb] bg-white px-4 text-left shadow-[0_8px_22px_rgba(28,35,54,0.04)] hover:bg-[#fbfcff]"
                            aria-label="Ouvrir la recherche"
                        >
                            <Search className="h-4 w-4 text-[#10121a]" />
                            <span className="flex-1 text-sm text-[#8d93a2]">Rechercher</span>
                            <span className="hidden items-center gap-1 rounded-lg border border-[#e3e6ee] bg-[#f8f9fc] px-2.5 py-1.5 text-xs font-semibold text-[#606779] sm:inline-flex">
                                {isMacLike ? <Command className="h-3.5 w-3.5" /> : <span>Ctrl</span>} <span>K</span>
                            </span>
                        </button>
                    </div>
                    <Link
                        href="/dashboard/clients/new"
                        className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl border border-[#dde2eb] bg-white px-3 text-xs font-semibold whitespace-nowrap text-[#11131d] shadow-[0_8px_22px_rgba(28,35,54,0.04)] hover:bg-[#f8f9fc] sm:text-sm"
                        aria-label="Créer un nouveau client"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nouveau client</span>
                    </Link>
                </div>
            </div>

            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogContent
                    hideCloseButton
                    aria-describedby={undefined}
                    className="overflow-hidden border-[#dfe3ef] bg-[#f8faff] p-0 text-[#2f3344] sm:max-w-3xl"
                >
                    <DialogTitle className="sr-only">Recherche globale</DialogTitle>
                    <DialogDescription className="sr-only">Recherchez des clients, interactions et projets.</DialogDescription>

                    <form onSubmit={handleSubmit} className="border-b border-[#e3e8f2] bg-white p-3">
                        <div className="flex items-center gap-3 rounded-2xl border border-[#dde2eb] bg-[#fbfcff] px-4 py-3 shadow-[0_8px_22px_rgba(28,35,54,0.04)]">
                            <Search className="h-4 w-4 text-[#10121a]" />
                            <input
                                ref={searchInputRef}
                                name="q"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                aria-label="Rechercher"
                                placeholder="Rechercher dans le CRM"
                                className="w-full bg-transparent text-sm text-[#10121a] outline-none placeholder:text-[#8d93a2]"
                            />
                            <span className="rounded-lg border border-[#e3e6ee] bg-white px-2 py-1 text-[11px] font-semibold text-[#7a8194]">Esc</span>
                        </div>
                    </form>

                    <div className="max-h-[min(70vh,560px)] overflow-auto bg-[#f8faff] p-4">
                        {!query.trim() ? (
                            <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-[#dfe3ef] bg-white/70 px-6 text-sm text-[#8f93a9]">
                                Aucun historique pour le moment.
                            </div>
                        ) : !hasSearchData ? (
                            <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-[#dfe3ef] bg-white/70 px-6 text-sm text-[#8f93a9]">
                                Continuez à taper puis validez pour lancer une recherche globale.
                            </div>
                        ) : searchResults.total === 0 ? (
                            <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-dashed border-[#dfe3ef] bg-white/70 px-6 text-sm text-[#8f93a9]">
                                Aucun résultat pour “{query}”.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {searchResults.clients.length > 0 ? (
                                    <div>
                                        <p className="px-1 pb-3 text-[13px] font-semibold text-[#2f3344]">Clients</p>
                                        <div className="space-y-2">
                                        {searchResults.clients.map((item) => (
                                            <Link
                                                key={`client-${item.id}`}
                                                href={item.href}
                                                onClick={() => setIsSearchOpen(false)}
                                                className="flex items-center gap-4 rounded-[18px] border border-[#e3e8f2] bg-white px-4 py-4 text-[#2f3344] transition hover:bg-[#f6f8fc]"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dfe3ef] bg-[#f8faff]">
                                                    <Users className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-[#95a4bd]">CRM / Clients</p>
                                                    <p className="truncate text-[15px] font-semibold">{item.label}</p>
                                                    <p className="truncate text-xs text-[#7c8298]">{item.meta}</p>
                                                </div>
                                                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#91a0b8]" />
                                            </Link>
                                        ))}
                                        </div>
                                    </div>
                                ) : null}

                                {searchResults.interactions.length > 0 ? (
                                    <div>
                                        <p className="px-1 pb-3 text-[13px] font-semibold text-[#2f3344]">Interactions</p>
                                        <div className="space-y-2">
                                        {searchResults.interactions.map((item) => (
                                            <Link
                                                key={`interaction-${item.id}`}
                                                href={item.href}
                                                onClick={() => setIsSearchOpen(false)}
                                                className="flex items-center gap-4 rounded-[18px] border border-[#e3e8f2] bg-white px-4 py-4 text-[#2f3344] transition hover:bg-[#f6f8fc]"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dfe3ef] bg-[#f8faff]">
                                                    <MessageSquareText className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-[#95a4bd]">CRM / Interactions</p>
                                                    <p className="truncate text-[15px] font-semibold">{item.label}</p>
                                                    <p className="truncate text-xs text-[#7c8298]">{item.meta}</p>
                                                </div>
                                                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#91a0b8]" />
                                            </Link>
                                        ))}
                                        </div>
                                    </div>
                                ) : null}

                                {searchResults.projects.length > 0 ? (
                                    <div>
                                        <p className="px-1 pb-3 text-[13px] font-semibold text-[#2f3344]">Projets</p>
                                        <div className="space-y-2">
                                        {searchResults.projects.map((item) => (
                                            <Link
                                                key={`project-${item.id}`}
                                                href={item.href}
                                                onClick={() => setIsSearchOpen(false)}
                                                className="flex items-center gap-4 rounded-[18px] border border-[#e3e8f2] bg-white px-4 py-4 text-[#2f3344] transition hover:bg-[#f6f8fc]"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#dfe3ef] bg-[#f8faff]">
                                                    <FolderKanban className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-semibold text-[#95a4bd]">CRM / Projets</p>
                                                    <p className="truncate text-[15px] font-semibold">{item.label}</p>
                                                    <p className="truncate text-xs text-[#7c8298]">{item.meta}</p>
                                                </div>
                                                <ArrowUpRight className="h-4 w-4 shrink-0 text-[#91a0b8]" />
                                            </Link>
                                        ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
