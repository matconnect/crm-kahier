"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type UpcomingInteraction = {
    clientId: string;
    clientName: string;
    type: string;
    upcomingAt: string;
};

type UpcomingInteractionsNoticeProps = {
    upcoming: UpcomingInteraction[];
    alertWindowDays: number;
};

export function UpcomingInteractionsNotice({
    upcoming,
    alertWindowDays,
}: UpcomingInteractionsNoticeProps) {
    if (upcoming.length === 0) return null;

    const next = upcoming[0]!;
    const maxItems = 5;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900"
                >
                    <Bell className="h-3.5 w-3.5" />
                    <span className="max-w-[220px] truncate">
                        {next.clientName} · {next.type}{" "}
                        {new Date(next.upcomingAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                        })}
                    </span>
                    {upcoming.length > 1 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                            +{upcoming.length - 1}
                        </span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3 max-h-60 overflow-auto" align="end">
                <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase  text-muted-foreground">
                        Interactions à venir ({alertWindowDays} jours)
                    </div>
                    <div className="space-y-1">
                        {upcoming.slice(0, maxItems).map((interaction) => (
                            <Link
                                key={`${interaction.clientId}-${interaction.upcomingAt}`}
                                href={`/dashboard/clients/${interaction.clientId}`}
                                className="flex items-start justify-between gap-2 rounded-md border border-dashed border-muted px-2 py-2 text-xs text-foreground hover:bg-muted"
                            >
                                <div className="min-w-0">
                                    <div className="truncate font-medium">{interaction.clientName}</div>
                                    <div className="text-muted-foreground">{interaction.type}</div>
                                </div>
                                <div className="shrink-0 text-[11px] text-muted-foreground">
                                    {new Date(interaction.upcomingAt).toLocaleString("fr-FR", {
                                        dateStyle: "short",
                                        timeStyle: "short",
                                    })}
                                </div>
                            </Link>
                        ))}
                    </div>
                    {upcoming.length > maxItems && (
                        <div className="text-[11px] text-muted-foreground">
                            {upcoming.length - maxItems} interaction(s) supplémentaire(s) dans les {alertWindowDays} prochains jours.
                        </div>
                    )}
                    <Link
                        href="/dashboard/clients"
                        className="inline-flex items-center text-xs font-medium text-foreground hover:underline"
                    >
                        Voir tous les clients
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
