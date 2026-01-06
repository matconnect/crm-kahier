"use client";

import { StickyNote } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Card className="border-muted/60">
            <CardHeader className="space-y-1">
                <CardTitle className="text-base">Notes & contexte</CardTitle>
                <CardDescription>Brief de contexte, enjeux, prochaines étapes.</CardDescription>
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
