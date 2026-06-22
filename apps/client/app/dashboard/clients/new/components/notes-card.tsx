"use client";

import { StickyNote } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
    notes: string;
    pending: boolean;
    textareaClass: string;
    onChange: (value: string) => void;
};

export function NotesCard({ notes, pending, textareaClass, onChange }: Props) {
    return (
        <Card className="rounded-lg border border-slate-200 bg-white/95 shadow-[0_16px_42px_rgba(28,35,54,0.06)] backdrop-blur-sm transition hover:-translate-y-px hover:shadow-[0_20px_54px_rgba(28,35,54,0.08)]">
            <CardHeader className="space-y-1">
                <CardTitle className="text-base text-slate-950">Notes & contexte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Label htmlFor="notes" className="flex items-center gap-2 text-sm">
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                    Notes internes
                </Label>
                <textarea
                    id="notes"
                    className={cn(textareaClass)}
                    placeholder="Rappeler après la démo, budget validé, décideur : DAF."
                    value={notes}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={pending}
                />
            </CardContent>
        </Card>
    );
}
