"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

type Interaction = {
    id: string;
    type: string;
    summary: string | null;
    occurredAt: string;
    user?: { firstName: string | null; lastName: string | null; email: string | null } | null;
    collaborators?: { firstName: string | null; lastName: string | null; email: string | null }[];
    meetingStart?: string | null;
    meetingEnd?: string | null;
};

type Props = {
    interactions: Interaction[];
    clientId: string;
    currentUserId: string;
};

const PER_PAGE = 5;

export function InteractionsList({ interactions, clientId, currentUserId }: Props) {
    const [page, setPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingSummary, setEditingSummary] = useState<string>("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(false);
    const totalPages = useMemo(() => Math.max(1, Math.ceil(interactions.length / PER_PAGE)), [interactions.length]);
    const items = useMemo(
        () => interactions.slice((page - 1) * PER_PAGE, page * PER_PAGE),
        [interactions, page],
    );

    if (interactions.length === 0) {
        return <p className="text-sm text-muted-foreground">Aucune interaction enregistrée.</p>;
    }

    async function updateInteraction(id: string) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
            toast.error("NEXT_PUBLIC_API_URL manquant");
            return;
        }
        if (!editingSummary.trim()) {
            toast.error("La note ne peut pas être vide");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur non authentifié");
            return;
        }

        try {
        const res = await fetch(`${apiBase}/clients/${clientId}/interactions/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": currentUserId,
            },
            body: JSON.stringify({ summary: editingSummary.trim(), userId: currentUserId }),
        });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error ?? "Impossible de mettre à jour l'interaction");
            toast.success("Interaction mise à jour");
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur inattendue");
        }
    }

    async function deleteInteraction(id: string) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        if (!apiBase) {
            toast.error("NEXT_PUBLIC_API_URL manquant");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur non authentifié");
            return;
        }
        try {
            setPendingDelete(true);
            const res = await fetch(`${apiBase}/clients/${clientId}/interactions/${id}`, {
                method: "DELETE",
                headers: { "x-user-id": currentUserId },
            });
            if (!res.ok) throw new Error("Impossible de supprimer l'interaction");
            toast.success("Interaction supprimée");
            window.location.reload();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur inattendue");
        } finally {
            setPendingDelete(false);
            setDeleteOpen(false);
            setDeleteId(null);
        }
    }

    return (
        <div className="space-y-3" id="client-interactions">
            {items.map((interaction) => (
                <div key={interaction.id} className="rounded-md border border-dashed border-muted px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <div className="text-sm font-medium">{interaction.type}</div>
                            <div className="text-xs text-muted-foreground">
                        {new Date(interaction.occurredAt).toLocaleString("fr-FR")}
                                {interaction.user ? (
                                    <>
                                        {" · "}
                                        {`${interaction.user.firstName ?? ""} ${interaction.user.lastName ?? ""}`.trim() ||
                                            interaction.user.email ||
                                            "Utilisateur"}
                                    </>
                                ) : null}
                                {interaction.type === "Réunion" && interaction.meetingStart && interaction.meetingEnd ? (
                                    <>
                                        {" · "}
                                        {new Date(interaction.meetingStart).toLocaleString("fr-FR")} →{" "}
                                        {new Date(interaction.meetingEnd).toLocaleString("fr-FR")}
                                    </>
                                ) : null}
                                {interaction.collaborators && interaction.collaborators.length > 0 ? (
                                    <>
                                        {" · "}
                                        Avec{" "}
                                        {interaction.collaborators
                                            .map(
                                                (collaborator) =>
                                                    `${collaborator.firstName ?? ""} ${collaborator.lastName ?? ""}`.trim() ||
                                                    collaborator.email ||
                                                    "Collaborateur",
                                            )
                                            .join(", ")}
                                    </>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setEditingId(interaction.id);
                                    setEditingSummary(interaction.summary ?? "");
                                }}
                            >
                                <Pencil className="mr-1 h-3 w-3" />
                                Éditer
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setDeleteId(interaction.id);
                                    setDeleteOpen(true);
                                }}
                            >
                                <Trash2 className="mr-1 h-3 w-3" />
                                Supprimer
                            </Button>
                        </div>
                    </div>
                    {editingId === interaction.id ? (
                        <div className="mt-2 space-y-2">
                            <textarea
                                className="w-full rounded-md border bg-background p-2 text-sm"
                                value={editingSummary}
                                onChange={(e) => setEditingSummary(e.target.value)}
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateInteraction(interaction.id)}>
                                    Sauvegarder
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                    Annuler
                                </Button>
                            </div>
                        </div>
                    ) : (
                        interaction.summary && <p className="mt-1 text-sm text-muted-foreground">{interaction.summary}</p>
                    )}
                </div>
            ))}

            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <span>
                        Page {page} / {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Précédent
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        >
                            Suivant
                        </Button>
                    </div>
                </div>
            )}

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l&apos;interaction ?</DialogTitle>
                        <DialogDescription>
                            Cette action est définitive. L&apos;interaction sera retirée de l&apos;historique.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={pendingDelete}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteInteraction(deleteId)}
                            disabled={pendingDelete || !deleteId}
                        >
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
