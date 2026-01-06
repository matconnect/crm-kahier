"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

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
    contactId: string;
    companyId: string;
};

export function DeleteContactDialog({ clientId, contactId, companyId }: Props) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    async function onDelete() {
        if (!apiBase) {
            toast.error("NEXT_PUBLIC_API_URL manquant");
            return;
        }

        setPending(true);
        try {
            const res = await fetch(`${apiBase}/clients/${clientId}/contacts/${contactId}`, {
                method: "DELETE",
                headers: companyId ? { "x-company-id": companyId } : undefined,
            });
            if (!res.ok) throw new Error("Impossible de supprimer le contact");
            toast.success("Contact supprimé");
            setOpen(false);
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
                <Button variant="outline" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Supprimer ce contact ?</DialogTitle>
                    <DialogDescription>Cette action est définitive.</DialogDescription>
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
