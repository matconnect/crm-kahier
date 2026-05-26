"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getBrowserApiBase } from "@/lib/public-api-base";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
    clientId: string;
    clientName: string;
    currentUserId: string;
    redirectTo?: string;
    triggerClassName?: string;
};

export function DeleteClientDialog({
    clientId,
    clientName,
    currentUserId,
    redirectTo,
    triggerClassName,
}: Props) {
    const apiBase = getBrowserApiBase();
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    async function onDelete() {
        if (!apiBase) {
            toast.error("NEXT_PUBLIC_API_URL manquant");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur non authentifié");
            return;
        }

        setPending(true);
        try {
            const res = await fetch(`${apiBase}/clients/${clientId}`, {
                method: "DELETE",
                headers: { "x-user-id": currentUserId },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error ?? "Impossible de supprimer le client");
            }

            toast.success("Client supprimé");
            setOpen(false);
            if (redirectTo) {
                window.location.assign(redirectTo);
                return;
            }
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur inattendue");
        } finally {
            setPending(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={["text-black", triggerClassName ?? ""].filter(Boolean).join(" ")}>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Supprimer ce client ?</DialogTitle>
                    <DialogDescription>
                        Cette action est définitive. Le client{" "}
                        <span className="font-medium text-foreground">{clientName}</span> sera supprimé.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                        Annuler
                    </Button>
                    <Button variant="destructive" onClick={onDelete} disabled={pending}>
                        Supprimer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
