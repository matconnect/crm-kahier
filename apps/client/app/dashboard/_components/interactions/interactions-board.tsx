"use client";

import { useEffect, useMemo, useState } from "react";

import { InteractionDetailsPanel } from "./interaction-details-panel";
import { InteractionsListPanel } from "./interactions-list-panel";
import type { InteractionItem } from "../shared/types";

type InteractionsBoardProps = {
    interactions: InteractionItem[];
};

export function InteractionsBoard({ interactions }: InteractionsBoardProps) {
    const [query, setQuery] = useState("");
    const [selectedInteractionId, setSelectedInteractionId] = useState<string | null>(interactions[0]?.id ?? null);

    const filteredInteractions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return interactions;

        return interactions.filter((item) => {
            const haystack = `${item.clientName} ${item.summary} ${item.type} ${item.badge}`.toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    }, [interactions, query]);

    useEffect(() => {
        if (filteredInteractions.length === 0) {
            setSelectedInteractionId(null);
            return;
        }

        const selectedStillExists = filteredInteractions.some((item) => item.id === selectedInteractionId);
        if (!selectedStillExists) {
            setSelectedInteractionId(filteredInteractions[0]?.id ?? null);
        }
    }, [filteredInteractions, selectedInteractionId]);

    const selectedInteraction = filteredInteractions.find((item) => item.id === selectedInteractionId) ?? null;

    return (
        <section
            id="interactions-board"
            className="rounded-[28px] border border-white/70 bg-white shadow-[0_20px_50px_rgba(29,33,49,0.08)] xl:col-span-2"
        >
            <div className="grid xl:grid-cols-[1fr_1.2fr]">
                <InteractionsListPanel
                    interactions={filteredInteractions}
                    selectedInteractionId={selectedInteractionId}
                    onSelectInteraction={setSelectedInteractionId}
                />
                <InteractionDetailsPanel
                    query={query}
                    onQueryChange={setQuery}
                    selectedInteraction={selectedInteraction}
                />
            </div>
        </section>
    );
}
