"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarIcon, Eye, LockKeyhole, Plus, Save, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBrowserApiBase } from "@/lib/public-api-base";
import {
    calculateFormLine,
    calculateFormTotals,
    formatInvoiceMoney,
    toDateInput,
    type Invoice,
    type ClientOption,
    type InvoiceFormLine,
    type InvoiceStatus,
} from "../_lib/invoices";

type Props = {
    currentUserId: string;
    clients: ClientOption[];
    invoice?: Invoice;
    initialPreviewOpen?: boolean;
};

type FormState = {
    clientId: string;
    status: InvoiceStatus;
    issueDate: string;
    dueDate: string;
    paidAt: string;
    notes: string;
    lines: InvoiceFormLine[];
};

const fieldClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

function defaultDates() {
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return { issueDate: issueDate.toISOString().slice(0, 10), dueDate: dueDate.toISOString().slice(0, 10) };
}

function parseDateInput(value: string) {
    if (!value) return undefined;
    const date = parseISO(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateButtonLabel(value: string, placeholder: string) {
    const date = parseDateInput(value);
    return date ? format(date, "PPP", { locale: fr }) : placeholder;
}

function formatDateText(value: string) {
    const date = parseDateInput(value);
    return date ? format(date, "PPP", { locale: fr }) : "—";
}

function initialState(invoice?: Invoice): FormState {
    const dates = defaultDates();
    if (!invoice) {
        return {
            clientId: "",
            status: "DRAFT",
            issueDate: dates.issueDate,
            dueDate: dates.dueDate,
            paidAt: "",
            notes: "",
            lines: [{ description: "", quantity: "1", unitPrice: "", vatRate: "20" }],
        };
    }
    return {
        clientId: invoice.client.id,
        status: invoice.storedStatus,
        issueDate: toDateInput(invoice.issueDate),
        dueDate: toDateInput(invoice.dueDate),
        paidAt: toDateInput(invoice.paidAt),
        notes: invoice.notes ?? "",
        lines: invoice.lines.map((line) => ({
            description: line.description,
            quantity: String(line.quantity),
            unitPrice: String(line.unitPrice),
            vatRate: String(line.vatRate),
        })),
    };
}

function validate(form: FormState): string | null {
    if (!form.clientId) return "Sélectionnez un client.";
    if (!form.issueDate || !form.dueDate) return "Renseignez les dates.";
    if (form.dueDate < form.issueDate) return "L’échéance doit être postérieure à l’émission.";
    if (!form.lines.length) return "Ajoutez une ligne.";
    for (const line of form.lines) {
        const quantity = Number(line.quantity.replace(",", "."));
        const unitPrice = Number(line.unitPrice.replace(",", "."));
        const vatRate = Number(line.vatRate.replace(",", "."));
        if (!line.description.trim()) return "Renseignez chaque désignation.";
        if (!Number.isFinite(quantity) || quantity <= 0) return "Les quantités doivent être supérieures à zéro.";
        if (!Number.isFinite(unitPrice) || unitPrice < 0) return "Les prix unitaires sont invalides.";
        if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) return "Les taux de TVA sont invalides.";
    }
    return null;
}

function DateField({
    id,
    label,
    value,
    onChange,
    placeholder,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id={id}
                        type="button"
                        variant="outline"
                        className="h-10 w-full justify-start rounded-xl bg-white text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className={value ? "text-slate-950" : "text-slate-500"}>
                            {formatDateButtonLabel(value, placeholder)}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        locale={fr}
                        selected={parseDateInput(value)}
                        onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : "")}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

export function InvoiceForm({ currentUserId, clients, invoice, initialPreviewOpen }: Props) {
    const router = useRouter();
    const apiBase = getBrowserApiBase();
    const [pending, setPending] = React.useState(false);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState<string | null>(null);
    const [pdfPreviewLoading, setPdfPreviewLoading] = React.useState(false);
    const [form, setForm] = React.useState<FormState>(() => initialState(invoice));
    const totals = React.useMemo(() => calculateFormTotals(form.lines), [form.lines]);

    React.useEffect(() => {
        if (initialPreviewOpen) {
            setPreviewOpen(true);
        }
    }, [initialPreviewOpen]);

    React.useEffect(
        () => () => {
            if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
        },
        [pdfPreviewUrl],
    );

    React.useEffect(() => {
        let cancelled = false;
        async function loadPdf() {
            if (!previewOpen || !invoice?.id || !apiBase) return;
            setPdfPreviewLoading(true);
            try {
                const response = await fetch(`${apiBase}/invoices/${invoice.id}/pdf`, {
                    headers: { "x-user-id": currentUserId },
                });
                if (!response.ok) throw new Error("Aperçu PDF impossible.");
                const blob = await response.blob();
                if (cancelled) return;
                const nextUrl = URL.createObjectURL(blob);
                setPdfPreviewUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return nextUrl;
                });
            } catch {
                if (!cancelled) {
                    setPdfPreviewUrl((current) => {
                        if (current) URL.revokeObjectURL(current);
                        return null;
                    });
                }
            } finally {
                if (!cancelled) setPdfPreviewLoading(false);
            }
        }
        void loadPdf();
        if (!previewOpen) {
            setPdfPreviewLoading(false);
        }
        return () => {
            cancelled = true;
        };
    }, [apiBase, currentUserId, invoice?.id, previewOpen]);

    function updateLine(index: number, key: keyof InvoiceFormLine, value: string) {
        setForm((current) => ({
            ...current,
            lines: current.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
        }));
    }

    async function persistDraft(): Promise<string | null> {
        const error = validate(form);
        if (error) {
            toast.error(error);
            return null;
        }
        if (!apiBase) {
            toast.error("API indisponible.");
            return null;
        }

        setPending(true);
        try {
            const response = await fetch(`${apiBase}/invoices${invoice ? `/${invoice.id}` : ""}`, {
                method: invoice ? "PATCH" : "POST",
                headers: { "content-type": "application/json", "x-user-id": currentUserId },
                body: JSON.stringify({
                    ...form,
                    status: "DRAFT",
                    paidAt: form.paidAt || null,
                    notes: form.notes.trim() || null,
                    lines: form.lines.map((line) => ({
                        description: line.description.trim(),
                        quantity: line.quantity,
                        unitPrice: line.unitPrice,
                        vatRate: line.vatRate,
                    })),
                }),
            });
            const data = (await response.json().catch(() => null)) as { id?: string; error?: string } | null;
            if (!response.ok) throw new Error(data?.error ?? "Enregistrement impossible.");
            return data?.id ?? invoice?.id ?? null;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Enregistrement impossible.");
            return null;
        } finally {
            setPending(false);
        }
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const id = await persistDraft();
        if (!id) return;
        toast.success(invoice ? "Brouillon mis à jour." : "Brouillon créé.");
        if (!invoice) router.push(`/dashboard/factures/${id}`);
        else router.refresh();
    }

    async function validateAndLock() {
        if (!invoice || !apiBase) return;
        const id = await persistDraft();
        if (!id) return;
        setPending(true);
        try {
            const response = await fetch(`${apiBase}/invoices/${invoice.id}/validate`, {
                method: "POST",
                headers: { "x-user-id": currentUserId },
            });
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) throw new Error(data?.error ?? "Validation impossible.");
            toast.success("Facture validée et verrouillée.");
            setPreviewOpen(false);
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Validation impossible.");
        } finally {
            setPending(false);
        }
    }

    async function openPreview() {
        const error = validate(form);
        if (error) return toast.error(error);
        if (!invoice) {
            const id = await persistDraft();
            if (!id) return;
            router.push(`/dashboard/factures/${id}?preview=1`);
            return;
        }
        setPreviewOpen(true);
    }

    if (invoice && invoice.storedStatus !== "DRAFT") {
        return (
            <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-8">
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Facture verrouillée</p>
                        <p className="mt-1 text-sm">Les informations et les montants ne peuvent plus être modifiés après validation.</p>
                    </div>
                </div>
                <InvoicePreview
                    number={invoice.number}
                    clientName={invoice.client.name}
                    issueDate={form.issueDate}
                    dueDate={form.dueDate}
                    notes={form.notes}
                    lines={form.lines}
                />
            </section>
        );
    }

    return (
        <>
            <form onSubmit={submit} className="space-y-6">
                <section className="grid gap-6 rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:grid-cols-2 md:p-7">
                    <div className="space-y-2">
                        <Label htmlFor="clientId">Client</Label>
                        <Select
                            value={form.clientId}
                            onValueChange={(value) => setForm((current) => ({ ...current, clientId: value }))}
                        >
                            <SelectTrigger id="clientId" className="h-10 w-full rounded-xl bg-white">
                                <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DateField
                        id="issueDate"
                        label="Émission"
                        value={form.issueDate}
                        onChange={(value) => setForm((current) => ({ ...current, issueDate: value }))}
                        placeholder="Sélectionner une date"
                    />
                    <DateField
                        id="dueDate"
                        label="Échéance"
                        value={form.dueDate}
                        onChange={(value) => setForm((current) => ({ ...current, dueDate: value }))}
                        placeholder="Sélectionner une date"
                    />
                    {form.status === "PAID" ? (
                        <DateField
                            id="paidAt"
                            label="Paiement"
                            value={form.paidAt}
                            onChange={(value) => setForm((current) => ({ ...current, paidAt: value }))}
                            placeholder="Sélectionner une date"
                        />
                    ) : null}
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Notes</Label>
                        <textarea
                            id="notes"
                            className={`${fieldClass} min-h-24 resize-y py-3`}
                            value={form.notes}
                            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                        />
                    </div>
                </section>

                <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-slate-950">Lignes</h2>
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-full"
                            onClick={() =>
                                setForm((current) => ({
                                    ...current,
                                    lines: [...current.lines, { description: "", quantity: "1", unitPrice: "", vatRate: "20" }],
                                }))
                            }
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {form.lines.map((line, index) => {
                            const calculated = calculateFormLine(line);
                            return (
                                <div
                                    key={index}
                                    className="grid gap-3 rounded-2xl border border-slate-200 bg-[#fafbff] p-4 md:grid-cols-[minmax(220px,1fr)_100px_140px_100px_130px_40px] md:items-end"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor={`description-${index}`}>Désignation</Label>
                                        <Input
                                            id={`description-${index}`}
                                            value={line.description}
                                            onChange={(event) => updateLine(index, "description", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`quantity-${index}`}>Quantité</Label>
                                        <Input
                                            id={`quantity-${index}`}
                                            inputMode="decimal"
                                            value={line.quantity}
                                            onChange={(event) => updateLine(index, "quantity", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`unit-price-${index}`}>Prix HT</Label>
                                        <Input
                                            id={`unit-price-${index}`}
                                            inputMode="decimal"
                                            value={line.unitPrice}
                                            onChange={(event) => updateLine(index, "unitPrice", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`vat-${index}`}>TVA %</Label>
                                        <Input
                                            id={`vat-${index}`}
                                            inputMode="decimal"
                                            value={line.vatRate}
                                            onChange={(event) => updateLine(index, "vatRate", event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="block text-sm font-medium">Total TTC</span>
                                        <div className="flex h-10 items-center font-semibold text-slate-950">
                                            {formatInvoiceMoney(calculated.totalCents)}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Supprimer la ligne"
                                        disabled={form.lines.length === 1}
                                        onClick={() =>
                                            setForm((current) => ({
                                                ...current,
                                                lines: current.lines.filter((_, lineIndex) => lineIndex !== index),
                                            }))
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 ml-auto w-full max-w-sm space-y-3 rounded-2xl bg-slate-950 p-5 text-white">
                        <div className="flex justify-between text-sm text-slate-300">
                            <span>Total HT</span>
                            <span>{formatInvoiceMoney(totals.subtotalCents)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-300">
                            <span>TVA</span>
                            <span>{formatInvoiceMoney(totals.vatCents)}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/15 pt-3 text-lg font-semibold">
                            <span>Total TTC</span>
                            <span>{formatInvoiceMoney(totals.totalCents)}</span>
                        </div>
                    </div>
                </section>

                <div className="flex flex-wrap justify-end gap-2">
                    <Button type="button" variant="outline" className="h-11 rounded-full px-6" onClick={() => {
                        void openPreview();
                    }}>
                        <Eye className="h-4 w-4" />
                        Aperçu
                    </Button>
                    <Button disabled={pending} className="h-11 rounded-full bg-[#111322] px-6 text-white hover:bg-[#191d2e]">
                        <Save className="h-4 w-4" />
                        {pending ? "Enregistrement…" : invoice ? "Enregistrer le brouillon" : "Créer le brouillon"}
                    </Button>
                </div>
            </form>
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto p-0">
                    <DialogHeader className="border-b px-6 py-5">
                        <DialogTitle>Aperçu de la facture</DialogTitle>
                        <DialogDescription>Vérifiez soigneusement les informations avant validation. Le PDF affiché reprend la version enregistrée.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-6">
                        <div className="flex min-h-[38rem] flex-col">
                            <p className="mb-3 text-sm font-medium text-slate-700">Aperçu PDF</p>
                            <div className="relative min-h-[38rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                {pdfPreviewLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
                                        Chargement du PDF...
                                    </div>
                                ) : pdfPreviewUrl ? (
                                    <iframe title="Aperçu PDF facture" src={pdfPreviewUrl} className="h-[38rem] w-full" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
                                        L’aperçu PDF est indisponible pour le moment.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="border-t px-6 py-5">
                        <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>Corriger</Button>
                        {invoice ? (
                            <Button type="button" variant="destructive" disabled={pending} onClick={validateAndLock}>
                                <LockKeyhole className="h-4 w-4" />
                                Valider et verrouiller
                            </Button>
                        ) : (
                            <Button type="button" disabled={pending} onClick={async () => {
                                const id = await persistDraft();
                                if (!id) return;
                                toast.success("Brouillon créé.");
                                router.push(`/dashboard/factures/${id}`);
                            }}>
                                <Save className="h-4 w-4" />
                                Enregistrer le brouillon
                            </Button>
                        )}
                    </DialogFooter>
                    {invoice ? (
                        <div className="mx-6 mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            Après validation, la facture ne pourra plus être modifiée.
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </>
    );
}

function InvoicePreview({
    number,
    clientName,
    issueDate,
    dueDate,
    notes,
    lines,
}: {
    number: string;
    clientName: string;
    issueDate: string;
    dueDate: string;
    notes: string;
    lines: InvoiceFormLine[];
}) {
    const totals = calculateFormTotals(lines);
    return (
        <div className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-4 bg-slate-950 p-6 text-white sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Facture</p>
                    <p className="mt-2 text-xl font-semibold">{number}</p>
                </div>
                <div className="text-left text-sm sm:text-right">
                    <p>{clientName}</p>
                    <p className="mt-1 text-slate-400">
                        Émission {formatDateText(issueDate)} · Échéance {formatDateText(dueDate)}
                    </p>
                </div>
            </div>
            <div className="p-5 sm:p-6">
                <div className="space-y-3">
                    {lines.map((line, index) => {
                        const calculated = calculateFormLine(line);
                        return (
                            <div key={`${line.description}-${index}`} className="grid gap-1 border-b border-slate-100 pb-3 text-sm sm:grid-cols-[1fr_auto]">
                                <div>
                                    <p className="font-medium text-slate-950">{line.description || "—"}</p>
                                    <p className="text-slate-500">{line.quantity} × {line.unitPrice} € · TVA {line.vatRate}%</p>
                                </div>
                                <p className="font-semibold text-slate-950">{formatInvoiceMoney(calculated.totalCents)}</p>
                            </div>
                        );
                    })}
                </div>
                <div className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Total HT</span><span>{formatInvoiceMoney(totals.subtotalCents)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">TVA</span><span>{formatInvoiceMoney(totals.vatCents)}</span></div>
                    <div className="flex justify-between border-t pt-3 text-base font-semibold"><span>Total TTC</span><span>{formatInvoiceMoney(totals.totalCents)}</span></div>
                </div>
                {notes ? <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{notes}</p> : null}
            </div>
        </div>
    );
}
