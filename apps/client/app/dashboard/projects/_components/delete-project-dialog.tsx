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
    projectId: string;
    projectName: string;
    currentUserId: string;
    kahierCategoryId?: string | number | null;
    kahierTabId?: string | number | null;
    redirectTo?: string;
    triggerClassName?: string;
    triggerLabel?: string;
    triggerIconOnly?: boolean;
};

export function DeleteProjectDialog({
    projectId,
    projectName,
    currentUserId,
    kahierCategoryId,
    kahierTabId,
    redirectTo,
    triggerClassName,
    triggerLabel,
    triggerIconOnly,
}: Props) {
    const apiBase = getBrowserApiBase();
    const [open, setOpen] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    async function resolveKahierApiKey() {
        const local = typeof window !== "undefined" ? window.localStorage.getItem("kahier_api_key")?.trim() : "";
        if (local) return local;
        if (!apiBase || !currentUserId) return "";
        const res = await fetch(`${apiBase}/kahier-link`, {
            cache: "no-store",
            headers: { "x-user-id": currentUserId },
        });
        const data = (await res.json().catch(() => null)) as
            | { connection?: { kahierApiKey?: string | null } | null; error?: string }
            | null;
        const key = data?.connection?.kahierApiKey?.trim() ?? "";
        if (key && typeof window !== "undefined") {
            window.localStorage.setItem("kahier_api_key", key);
        }
        return key;
    }

    async function clearKahierLink() {
        if (!kahierCategoryId || !kahierTabId) return;
        const key = await resolveKahierApiKey();
        if (!key) {
            throw new Error("Clé API Kahier absente pour cet établissement.");
        }

        const res = await fetch(`${apiBase}/kahier/categories/${kahierCategoryId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": key,
            },
            body: JSON.stringify({
                periodeTabId: Number(kahierTabId),
                crmProjectId: null,
                crmProjectName: null,
            }),
        });
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) {
            throw new Error(data?.error ?? "Impossible de retirer le lien Kahier.");
        }
    }

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
            await clearKahierLink();
            const res = await fetch(`${apiBase}/projects/${projectId}`, {
                method: "DELETE",
                headers: { "x-user-id": currentUserId },
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error ?? "Impossible de supprimer le projet");
            }

            toast.success("Projet supprimé");
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
                <Button
                    variant={triggerIconOnly ? "ghost" : "outline"}
                    size={triggerIconOnly ? "icon" : "sm"}
                    title={triggerLabel ?? "Supprimer"}
                    className={[
                        triggerIconOnly ? "h-10 w-10 rounded-full text-red-600 hover:text-red-700" : "",
                        triggerClassName ?? "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                >
                    <Trash2 className="h-4 w-4" />
                    {triggerIconOnly ? <span className="sr-only">{triggerLabel ?? "Supprimer"}</span> : <span>{triggerLabel ?? "Supprimer"}</span>}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Supprimer ce projet ?</DialogTitle>
                    <DialogDescription>
                        Cette action est définitive. Le projet{" "}
                        <span className="font-medium text-foreground">{projectName}</span> sera supprimé.
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
