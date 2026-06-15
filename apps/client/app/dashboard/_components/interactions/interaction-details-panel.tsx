"use client";

import Link from "next/link";
import { Bot, Search } from "lucide-react";

import { formatTime } from "../shared/formatters";
import type { InteractionItem } from "../shared/types";

type InteractionDetailsPanelProps = {
    query: string;
    onQueryChange: (value: string) => void;
    selectedInteraction: InteractionItem | null;
};

export function InteractionDetailsPanel({
    query,
    onQueryChange,
    selectedInteraction,
}: InteractionDetailsPanelProps) {
    return (
        <div id="interaction-details" className="p-5">
            <div className="flex items-center justify-between gap-2">
                <label className="flex w-full items-center gap-2 rounded-xl bg-[#f4f6fb] px-3 py-2">
                    <Search className="h-4 w-4 text-[#8f93a9]" />
                    <input
                        value={query}
                        onChange={(event) => onQueryChange(event.target.value)}
                        aria-label="Rechercher une interaction"
                        placeholder="Rechercher"
                        className="w-full bg-transparent text-sm outline-none"
                    />
                </label>
                <Link href="/dashboard/clients" className="rounded-lg border border-[#e1e4ef] p-2" aria-label="Assistant interaction">
                    <Bot className="h-4 w-4" />
                </Link>
            </div>

            {selectedInteraction ? (
                <div className="mt-4 space-y-4 rounded-2xl border border-[#e7eaf3] bg-[#fafbff] p-4">
                    <div>
                        <p className="text-xs uppercase  text-[#8f93a9]">Interaction sélectionnée</p>
                        <p className="mt-1 text-lg font-bold text-[#202334]">{selectedInteraction.clientName}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="rounded-xl bg-white px-3 py-2">
                            <p className="text-[11px] uppercase  text-[#8f93a9]">Heure</p>
                            <p className="mt-1 font-semibold text-[#2d3145]">{formatTime(selectedInteraction.occurredAt)}</p>
                        </div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-3 text-sm text-[#555c74]">{selectedInteraction.summary}</div>

                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#f1ecff] px-3 py-1 text-xs font-semibold text-[#5c45dd]">
                            {selectedInteraction.type}
                        </span>
                    </div>

                    <Link
                        href={`/dashboard/clients/${selectedInteraction.clientId}`}
                        className="inline-flex items-center rounded-full border border-[#d7dced] bg-white px-4 py-2 text-sm font-semibold text-[#2f3344]"
                    >
                        Ouvrir la fiche client
                    </Link>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-[#e7eaf3] bg-[#fafbff] px-4 py-5 text-sm text-[#8f93a9]">
                    Aucune interaction trouvée avec ce filtre.
                </div>
            )}
        </div>
    );
}
