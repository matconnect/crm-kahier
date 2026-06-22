"use client";

import Link from "next/link";
import * as React from "react";
import { CheckCircle2, Download, Eye, PencilLine, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBrowserApiBase } from "@/lib/public-api-base";
import { QUOTE_STATUS_OPTIONS, type QuoteStatus } from "../_lib/quotes";

type Props = {
    quoteId: string;
    quoteNumber: string;
    currentUserId: string;
    status: QuoteStatus;
};

export function QuoteTableActions({ quoteId, quoteNumber, currentUserId, status }: Props) {
    const router = useRouter();
    const apiBase = getBrowserApiBase();
    const [confirm, setConfirm] = React.useState<null | "validate" | "delete">(null);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = React.useState(false);
    const [pending, setPending] = React.useState(false);

    function revokePdfUrl(url: string | null) {
        if (!url || typeof URL.revokeObjectURL !== "function") return;
        URL.revokeObjectURL(url);
    }

    React.useEffect(() => () => revokePdfUrl(pdfUrl), [pdfUrl]);

    React.useEffect(() => {
        let cancelled = false;
        async function loadPdf() {
            if (!previewOpen || !apiBase) return;
            setPdfLoading(true);
            try {
                const response = await fetch(`${apiBase}/quotes/${quoteId}/pdf`, {
                    headers: { "x-user-id": currentUserId },
                });
                if (!response.ok) throw new Error("Aperçu PDF impossible.");
                const blob = await response.blob();
                if (cancelled) return;
                const nextUrl = URL.createObjectURL(blob);
                setPdfUrl((current) => {
                    revokePdfUrl(current);
                    return nextUrl;
                });
            } catch {
                if (!cancelled) {
                    setPdfUrl((current) => {
                        revokePdfUrl(current);
                        return null;
                    });
                }
            } finally {
                if (!cancelled) setPdfLoading(false);
            }
        }
        void loadPdf();
        if (!previewOpen) setPdfLoading(false);
        return () => {
            cancelled = true;
        };
    }, [apiBase, currentUserId, previewOpen, quoteId]);

    async function validateQuote() {
        if (!apiBase) return toast.error("API indisponible.");
        setPending(true);
        try {
            const response = await fetch(`${apiBase}/quotes/${quoteId}/validate`, {
                method: "POST",
                headers: { "x-user-id": currentUserId },
            });
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) throw new Error(data?.error ?? "Validation impossible.");
            toast.success("Devis validé et verrouillé.");
            setConfirm(null);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Validation impossible.");
        } finally {
            setPending(false);
        }
    }

    async function deleteQuote() {
        if (!apiBase) return toast.error("API indisponible.");
        setPending(true);
        try {
            const response = await fetch(`${apiBase}/quotes/${quoteId}`, {
                method: "DELETE",
                headers: { "x-user-id": currentUserId },
            });
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) throw new Error(data?.error ?? "Suppression impossible.");
            toast.success("Devis supprimé.");
            setConfirm(null);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Suppression impossible.");
        } finally {
            setPending(false);
        }
    }

    async function updateStatus(nextStatus: QuoteStatus) {
        if (!apiBase) return toast.error("API indisponible.");
        setPending(true);
        try {
            const response = await fetch(`${apiBase}/quotes/${quoteId}/status`, {
                method: "PATCH",
                headers: { "content-type": "application/json", "x-user-id": currentUserId },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) throw new Error(data?.error ?? "Modification impossible.");
            toast.success("Statut du devis mis à jour.");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Modification impossible.");
        } finally {
            setPending(false);
        }
    }

    async function downloadPdf() {
        if (!apiBase) return toast.error("API indisponible.");
        setPending(true);
        try {
            const response = await fetch(`${apiBase}/quotes/${quoteId}/pdf`, {
                headers: { "x-user-id": currentUserId },
            });
            if (!response.ok) throw new Error("Téléchargement impossible.");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${quoteNumber}.pdf`;
            anchor.click();
            revokePdfUrl(url);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Téléchargement impossible.");
        } finally {
            setPending(false);
        }
    }

    const editableStatuses = QUOTE_STATUS_OPTIONS.filter((option) => option.value !== "DRAFT");

    return (
        <>
            <div className="flex items-center justify-end gap-1.5">
                {status === "DRAFT" ? (
                    <>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                            title="Aperçu"
                            onClick={() => setPreviewOpen(true)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full" title="Modifier">
                            <Link href={`/dashboard/devis/${quoteId}`}>
                                <PencilLine className="h-4 w-4" />
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full text-emerald-700 hover:text-emerald-800"
                            title="Valider"
                            onClick={() => setConfirm("validate")}
                        >
                            <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full text-red-600 hover:text-red-700"
                            title="Supprimer"
                            onClick={() => setConfirm("delete")}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </>
                ) : null}
                {status !== "DRAFT" ? (
                    <>
                        <Select value={status} onValueChange={(value) => updateStatus(value as QuoteStatus)}>
                            <SelectTrigger className="h-10 w-44 rounded-full bg-white">
                                <SelectValue placeholder="Changer le statut" />
                            </SelectTrigger>
                            <SelectContent>
                                {editableStatuses.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full"
                        title="Télécharger"
                        onClick={downloadPdf}
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </>
                ) : null}
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto p-0">
                    <DialogHeader className="border-b px-6 py-5">
                        <DialogTitle>Aperçu PDF</DialogTitle>
                        <DialogDescription>Vérifiez le document avant validation.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-6">
                        <div className="relative min-h-[38rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {pdfLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Chargement du PDF...</div>
                            ) : pdfUrl ? (
                                <iframe title="Aperçu PDF devis" src={pdfUrl} className="h-[38rem] w-full" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
                                    L’aperçu PDF est indisponible pour le moment.
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={confirm === "validate"} onOpenChange={(open) => setConfirm(open ? "validate" : null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Valider le devis {quoteNumber} ?</DialogTitle>
                        <DialogDescription>Le devis sera verrouillé et ne pourra plus être modifié.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setConfirm(null)} disabled={pending}>
                            Annuler
                        </Button>
                        <Button type="button" variant="destructive" onClick={validateQuote} disabled={pending}>
                            <CheckCircle2 className="h-4 w-4" />
                            Valider
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={confirm === "delete"} onOpenChange={(open) => setConfirm(open ? "delete" : null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer le devis {quoteNumber} ?</DialogTitle>
                        <DialogDescription>Cette action est définitive. Le devis sera supprimé du CRM.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setConfirm(null)} disabled={pending}>
                            Annuler
                        </Button>
                        <Button type="button" variant="destructive" onClick={deleteQuote} disabled={pending}>
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
