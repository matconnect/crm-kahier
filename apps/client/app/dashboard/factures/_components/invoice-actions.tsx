"use client";

import * as React from "react";
import { Download, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBrowserApiBase } from "@/lib/public-api-base";
import type { InvoiceStatus } from "../_lib/invoices";

export function InvoiceActions({
    invoiceId,
    invoiceNumber,
    currentUserId,
    status,
}: {
    invoiceId: string;
    invoiceNumber: string;
    currentUserId: string;
    status: InvoiceStatus;
}) {
    const router = useRouter();
    const apiBase = getBrowserApiBase();
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = React.useState(false);
    const statusOptions: Partial<Record<InvoiceStatus, InvoiceStatus[]>> = {
        SENT: ["PAID", "CANCELLED"],
        OVERDUE: ["PAID", "SENT", "CANCELLED"],
    };
    const labels: Record<InvoiceStatus, string> = {
        DRAFT: "Brouillon",
        SENT: "Envoyée",
        PAID: "Payée",
        OVERDUE: "En retard",
        CANCELLED: "Annulée",
    };

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
                const response = await fetch(`${apiBase}/invoices/${invoiceId}/pdf`, {
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
    }, [apiBase, currentUserId, invoiceId, previewOpen]);

    async function downloadPdf() {
        if (!apiBase) return toast.error("API indisponible.");
        try {
            const response = await fetch(`${apiBase}/invoices/${invoiceId}/pdf`, {
                headers: { "x-user-id": currentUserId },
            });
            if (!response.ok) throw new Error("Téléchargement impossible.");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${invoiceNumber}.pdf`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Téléchargement impossible.");
        }
    }

    async function remove() {
        if (!apiBase || !window.confirm(`Supprimer ${invoiceNumber} ?`)) return;
        try {
            const response = await fetch(`${apiBase}/invoices/${invoiceId}`, {
                method: "DELETE",
                headers: { "x-user-id": currentUserId },
            });
            if (!response.ok) {
                const data = (await response.json().catch(() => null)) as { error?: string } | null;
                throw new Error(data?.error ?? "Suppression impossible.");
            }
            toast.success("Facture supprimée.");
            router.push("/dashboard/factures");
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Suppression impossible.");
        }
    }

    async function updateStatus(nextStatus: InvoiceStatus) {
        if (!apiBase) return toast.error("API indisponible.");
        try {
            const response = await fetch(`${apiBase}/invoices/${invoiceId}/status`, {
                method: "PATCH",
                headers: { "content-type": "application/json", "x-user-id": currentUserId },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) throw new Error(data?.error ?? "Modification impossible.");
            toast.success(`Facture ${labels[nextStatus].toLowerCase()}.`);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Modification impossible.");
        }
    }

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {(statusOptions[status]?.length ?? 0) > 0 ? (
                    <Select onValueChange={(value) => updateStatus(value as InvoiceStatus)}>
                        <SelectTrigger className="h-10 w-40 rounded-full bg-white">
                            <SelectValue placeholder="Changer le statut" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions[status]?.map((option) => (
                                <SelectItem key={option} value={option}>
                                    {labels[option]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : null}
                <Button type="button" variant="outline" className="h-10 rounded-full bg-white px-4" onClick={() => setPreviewOpen(true)}>
                    <Eye className="h-4 w-4" />
                    Aperçu PDF
                </Button>
                <Button type="button" variant="outline" className="h-10 rounded-full bg-white px-4" onClick={downloadPdf}>
                    <Download className="h-4 w-4" />
                    PDF
                </Button>
                {status === "DRAFT" ? (
                    <Button type="button" variant="outline" className="h-10 rounded-full bg-white px-4 text-red-600" onClick={remove}>
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                    </Button>
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
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                                    Chargement du PDF...
                                </div>
                            ) : pdfUrl ? (
                                <iframe title="Aperçu PDF facture" src={pdfUrl} className="h-[38rem] w-full" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
                                    L’aperçu PDF est indisponible pour le moment.
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
