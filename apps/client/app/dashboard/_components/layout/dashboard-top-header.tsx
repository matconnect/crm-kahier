"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import type { ClientSearchItem, InteractionItem, ProjectSearchItem } from "../shared/types";

import { formatNowLabelAt, getGreetingAt } from "../shared/formatters";

type DashboardTopHeaderProps = {
    firstName: string;
    searchValue?: string;
    searchClients?: ClientSearchItem[];
    searchInteractions?: InteractionItem[];
    searchProjects?: ProjectSearchItem[];
};

export function DashboardTopHeader({
    firstName,
    searchValue,
    searchClients,
    searchInteractions,
    searchProjects,
}: DashboardTopHeaderProps) {
    const router = useRouter();
    const [query, setQuery] = useState(searchValue ?? "");
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        setQuery(searchValue ?? "");
    }, [searchValue]);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => window.clearInterval(timer);
    }, []);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmed = query.trim();
        const target = trimmed ? `/dashboard?q=${encodeURIComponent(trimmed)}` : "/dashboard";
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
        <div className="border-b border-[#d9dce8] bg-[#f8f9fd] px-4 py-4 md:px-8 md:py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xl font-semibold">{getGreetingAt(now)}, {firstName}.</p>
                    <p className="text-sm text-[#7f859b]">{formatNowLabelAt(now)}</p>
                    {nextInteraction ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#e9f7f4] px-2.5 py-1 text-[11px] font-semibold text-[#1b8d75]">
                                Prochaine interaction
                            </span>
                            <Link
                                href={`/dashboard/clients/${nextInteraction.clientId}`}
                                className="rounded-full border border-[#dfe3ef] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4a4f67] hover:bg-[#f4f6fb]"
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
                                    <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-[320px] rounded-2xl border border-[#dfe3ef] bg-white p-2 shadow-[0_18px_45px_rgba(29,33,49,0.18)]">
                                        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa0b5]">
                                            Interactions à venir
                                        </p>
                                        <div className="max-h-[240px] space-y-1 overflow-auto">
                                            {upcomingMore.map((item) => (
                                                <Link
                                                    key={`upcoming-${item.id}`}
                                                    href={`/dashboard/clients/${item.clientId}`}
                                                    className="block rounded-xl px-2 py-2 hover:bg-[#f4f6fb]"
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
                    <div className="relative flex-1 md:min-w-[420px]">
                        <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-2xl border border-[#e1e4ef] bg-white px-3 py-2">
                            <Search className="h-4 w-4 text-[#8f93a9]" />
                            <input
                                name="q"
                                value={query}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 120)}
                                onChange={(event) => setQuery(event.target.value)}
                                aria-label="Rechercher"
                                placeholder="Rechercher"
                                className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0a5ba]"
                            />
                            <button type="submit" className="rounded-xl bg-[#f3f5fb] px-3 py-1.5 text-xs font-semibold text-[#434965]">
                                Rechercher
                            </button>
                        </form>

                        {isSearchFocused && query.trim() ? (
                            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 rounded-2xl border border-[#dfe3ef] bg-white p-3 shadow-[0_18px_45px_rgba(29,33,49,0.18)]">
                                {!hasSearchData ? (
                                    <p className="px-2 py-2 text-sm text-[#8f93a9]">
                                        Continuez à taper puis cliquez sur Rechercher pour lancer une recherche globale.
                                    </p>
                                ) : searchResults.total === 0 ? (
                                    <p className="px-2 py-2 text-sm text-[#8f93a9]">Aucun résultat pour “{query}”.</p>
                                ) : (
                                    <div className="max-h-[360px] space-y-2 overflow-auto">
                                        {searchResults.clients.length > 0 ? (
                                            <div>
                                                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa0b5]">Clients</p>
                                                {searchResults.clients.map((item) => (
                                                    <Link key={`client-${item.id}`} href={item.href} className="block rounded-xl px-2 py-2 hover:bg-[#f4f6fb]">
                                                        <p className="text-sm font-semibold text-[#2f3344]">{item.label}</p>
                                                        <p className="text-xs text-[#7c8298]">{item.meta}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : null}

                                        {searchResults.interactions.length > 0 ? (
                                            <div>
                                                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa0b5]">Interactions</p>
                                                {searchResults.interactions.map((item) => (
                                                    <Link key={`interaction-${item.id}`} href={item.href} className="block rounded-xl px-2 py-2 hover:bg-[#f4f6fb]">
                                                        <p className="text-sm font-semibold text-[#2f3344]">{item.label}</p>
                                                        <p className="truncate text-xs text-[#7c8298]">{item.meta}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : null}

                                        {searchResults.projects.length > 0 ? (
                                            <div>
                                                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa0b5]">Projets</p>
                                                {searchResults.projects.map((item) => (
                                                    <Link key={`project-${item.id}`} href={item.href} className="block rounded-xl px-2 py-2 hover:bg-[#f4f6fb]">
                                                        <p className="text-sm font-semibold text-[#2f3344]">{item.label}</p>
                                                        <p className="truncate text-xs text-[#7c8298]">{item.meta}</p>
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                    <Link
                        href="/dashboard/projects/new"
                        className="inline-flex items-center gap-2 rounded-2xl border border-[#e1e4ef] bg-white px-4 py-3 text-sm font-semibold text-[#33364a]"
                    >
                        <Plus className="h-4 w-4" />
                        Nouveau projet
                    </Link>
                </div>
            </div>
        </div>
    );
}
