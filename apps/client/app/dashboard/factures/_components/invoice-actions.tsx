"use client";

import { Download, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
        <div className="flex flex-wrap gap-2">
            {(statusOptions[status]?.length ?? 0) > 0 ? (
                <Select onValueChange={(value) => updateStatus(value as InvoiceStatus)}>
                    <SelectTrigger className="h-9 w-40 rounded-full bg-white">
                        <SelectValue placeholder="Changer le statut" />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions[status]?.map((option) => (
                            <SelectItem key={option} value={option}>{labels[option]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : null}
            <Button type="button" variant="outline" className="rounded-full bg-white" onClick={downloadPdf}>
                <Download className="h-4 w-4" />
                PDF
            </Button>
            {status === "DRAFT" ? (
                <Button type="button" variant="outline" className="rounded-full bg-white text-red-600" onClick={remove}>
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                </Button>
            ) : null}
        </div>
    );
}
