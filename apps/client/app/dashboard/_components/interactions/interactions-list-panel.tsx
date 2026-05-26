"use client";

import { formatTime } from "../shared/formatters";
import type { InteractionItem } from "../shared/types";

type InteractionsListPanelProps = {
    interactions: InteractionItem[];
    selectedInteractionId: string | null;
    onSelectInteraction: (id: string) => void;
};

export function InteractionsListPanel({
    interactions,
    selectedInteractionId,
    onSelectInteraction,
}: InteractionsListPanelProps) {
    return (
        <div className="border-b border-[#eaedf5] p-5 xl:border-r xl:border-b-0">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Dernières interactions</h3>
                <span className="rounded-full bg-[#eff2fb] px-3 py-1 text-sm font-semibold">{interactions.length}</span>
            </div>
            <div className="mt-4 space-y-1">
                {interactions.length === 0 ? (
                    <p className="rounded-xl bg-[#f7f8fc] px-3 py-4 text-sm text-[#8f93a9]">Aucune interaction récente.</p>
                ) : (
                    interactions.map((item) => {
                        const isSelected = selectedInteractionId === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => onSelectInteraction(item.id)}
                                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                                    isSelected ? "bg-[#eef1fb]" : "hover:bg-[#f7f8fc]"
                                }`}
                            >
                                <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-[#202334]">{item.clientName}</span>
                                    <span className="block truncate text-xs text-[#7e849a]">{item.summary}</span>
                                </span>
                                <span className="ml-3 shrink-0 text-xs font-semibold text-[#8f93a9]">{formatTime(item.occurredAt)}</span>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
