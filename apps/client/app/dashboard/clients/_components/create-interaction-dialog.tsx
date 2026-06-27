"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { LogInteraction } from "./log-interaction";

type CreateInteractionDialogProps = {
    clientId: string;
    currentUserId: string;
    triggerClassName?: string;
};

export function CreateInteractionDialog({ clientId, currentUserId, triggerClassName }: CreateInteractionDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className={triggerClassName ?? "h-9 w-full rounded-full bg-slate-950 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 sm:w-auto"}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle interaction
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-1rem)] max-w-none overflow-hidden rounded-none p-0 sm:w-[calc(100vw-2rem)] sm:max-w-4xl sm:rounded-2xl lg:max-w-5xl">
                <div className="flex h-[calc(100vh-1rem)] flex-col sm:h-[calc(100vh-2rem)]">
                    <DialogHeader className="space-y-2">
                        <div className="border-b px-4 py-4 sm:px-6">
                            <DialogTitle>Créer une interaction</DialogTitle>
                            <DialogDescription className="mt-1">
                                Ajoute une note, un appel, une réunion ou un email lié à ce client.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        <LogInteraction
                            clientId={clientId}
                            currentUserId={currentUserId}
                            showCard={false}
                            enabled={open}
                            onSubmitted={() => setOpen(false)}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
