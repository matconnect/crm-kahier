"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarIcon, Download, Eye, LockKeyhole, Plus, Save, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBrowserApiBase } from "@/lib/public-api-base";
import { StickyDetailHeader } from "../../_components/layout/sticky-detail-header";
import {
    calculateFormLine,
    calculateFormTotals,
    formatQuoteMoney,
    toDateInput,
    type ClientOption,
    type Quote,
    type QuoteFormLine,
} from "../_lib/quotes";

type Props = {
    currentUserId: string;
    clients: ClientOption[];
    quote?: Quote;
    initialPreviewOpen?: boolean;
};

type FormState = {
    clientId: string;
    issueDate: string;
    expiryDate: string;
    notes: string;
    clientLocation: string;
    clientAddressLine1: string;
    clientAddressLine2: string;
    clientPostalCode: string;
    clientCity: string;
    clientCountry: string;
    clientSiren: string;
    clientVatNumber: string;
    clientPrimaryEmail: string;
    clientPrimaryPhone: string;
    lines: QuoteFormLine[];
};

const fieldClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

function RequiredLabel({
    htmlFor,
    children,
}: {
    htmlFor?: string;
    children: React.ReactNode;
}) {
    return (
        <Label htmlFor={htmlFor}>
            {children} <span className="text-red-600">*</span>
        </Label>
    );
}

function defaultDates() {
    const issueDate = new Date();
    const expiryDate = new Date(issueDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    return { issueDate: issueDate.toISOString().slice(0, 10), expiryDate: expiryDate.toISOString().slice(0, 10) };
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

function initialState(quote?: Quote): FormState {
    const dates = defaultDates();
    if (!quote) {
        return {
            clientId: "",
            issueDate: dates.issueDate,
            expiryDate: dates.expiryDate,
            notes: "",
            clientLocation: "",
            clientAddressLine1: "",
            clientAddressLine2: "",
            clientPostalCode: "",
            clientCity: "",
            clientCountry: "",
            clientSiren: "",
            clientVatNumber: "",
            clientPrimaryEmail: "",
            clientPrimaryPhone: "",
            lines: [{ description: "", quantity: "1", unitPrice: "", vatRate: "20" }],
        };
    }
    return {
        clientId: quote.client.id,
        issueDate: toDateInput(quote.issueDate),
        expiryDate: toDateInput(quote.expiryDate),
        notes: quote.notes ?? "",
        clientLocation: quote.client.location ?? "",
        clientAddressLine1: quote.client.addressLine1 ?? "",
        clientAddressLine2: quote.client.addressLine2 ?? "",
        clientPostalCode: quote.client.postalCode ?? "",
        clientCity: quote.client.city ?? "",
        clientCountry: quote.client.country ?? "",
        clientSiren: quote.client.siren ?? "",
        clientVatNumber: quote.client.vatNumber ?? "",
        clientPrimaryEmail: quote.client.primaryEmail ?? "",
        clientPrimaryPhone: quote.client.primaryPhone ?? "",
        lines: quote.lines.map((line) => ({
            description: line.description,
            quantity: String(line.quantity),
            unitPrice: String(line.unitPrice),
            vatRate: String(line.vatRate),
        })),
    };
}

function validate(form: FormState): string | null {
    if (!form.clientId) return "Sélectionnez un client.";
    if (!form.issueDate || !form.expiryDate) return "Renseignez les dates.";
    if (form.expiryDate < form.issueDate) return "La validité doit être postérieure à l’émission.";
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
    required = false,
}: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    required?: boolean;
}) {
    return (
        <div className="space-y-2">
            {required ? <RequiredLabel htmlFor={id}>{label}</RequiredLabel> : <Label htmlFor={id}>{label}</Label>}
            <Popover>
                <PopoverTrigger asChild>
                    <Button id={id} type="button" variant="outline" className="h-10 w-full justify-start rounded-xl bg-white text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className={value ? "text-slate-950" : "text-slate-500"}>{formatDateButtonLabel(value, placeholder)}</span>
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

export function QuoteForm({ currentUserId, clients, quote, initialPreviewOpen }: Props) {
    const router = useRouter();
    const apiBase = getBrowserApiBase();
    const [pending, setPending] = React.useState(false);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [pdfPreviewUrl, setPdfPreviewUrl] = React.useState<string | null>(null);
    const [pdfPreviewLoading, setPdfPreviewLoading] = React.useState(false);
    const [validateConfirmOpen, setValidateConfirmOpen] = React.useState(false);
    const [form, setForm] = React.useState<FormState>(() => initialState(quote));
    const totals = React.useMemo(() => calculateFormTotals(form.lines), [form.lines]);

    React.useEffect(() => {
        if (initialPreviewOpen) setPreviewOpen(true);
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
            if (!previewOpen || !quote?.id || !apiBase) return;
            setPdfPreviewLoading(true);
            try {
                const response = await fetch(`${apiBase}/quotes/${quote.id}/pdf`, {
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
        if (!previewOpen) setPdfPreviewLoading(false);
        return () => {
            cancelled = true;
        };
    }, [apiBase, currentUserId, previewOpen, quote?.id]);

    function updateLine(index: number, key: keyof QuoteFormLine, value: string) {
        setForm((current) => ({
            ...current,
            lines: current.lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)),
        }));
    }

    async function persistClientDetails() {
        if (!apiBase || !form.clientId) return;
        const selectedClient = clients.find((client) => client.id === form.clientId);
        if (!selectedClient) return;

        const nextLocation = form.clientLocation.trim();
        const nextAddressLine1 = form.clientAddressLine1.trim();
        const nextAddressLine2 = form.clientAddressLine2.trim();
        const nextPostalCode = form.clientPostalCode.trim();
        const nextCity = form.clientCity.trim();
        const nextCountry = form.clientCountry.trim();
        const nextSiren = form.clientSiren.trim();
        const nextVatNumber = form.clientVatNumber.trim();
        const nextPrimaryEmail = form.clientPrimaryEmail.trim();
        const nextPrimaryPhone = form.clientPrimaryPhone.trim();

        const hasChanges =
            (selectedClient.location ?? "") !== nextLocation ||
            (selectedClient.addressLine1 ?? "") !== nextAddressLine1 ||
            (selectedClient.addressLine2 ?? "") !== nextAddressLine2 ||
            (selectedClient.postalCode ?? "") !== nextPostalCode ||
            (selectedClient.city ?? "") !== nextCity ||
            (selectedClient.country ?? "") !== nextCountry ||
            (selectedClient.siren ?? "") !== nextSiren ||
            (selectedClient.vatNumber ?? "") !== nextVatNumber ||
            (selectedClient.primaryEmail ?? "") !== nextPrimaryEmail ||
            (selectedClient.primaryPhone ?? "") !== nextPrimaryPhone;

        if (!hasChanges) return;

        const response = await fetch(`${apiBase}/clients/${form.clientId}`, {
            method: "PATCH",
            headers: { "content-type": "application/json", "x-user-id": currentUserId },
            body: JSON.stringify({
                location: nextLocation || null,
                addressLine1: nextAddressLine1 || null,
                addressLine2: nextAddressLine2 || null,
                postalCode: nextPostalCode || null,
                city: nextCity || null,
                country: nextCountry || null,
                siren: nextSiren || null,
                vatNumber: nextVatNumber || null,
                primaryEmail: nextPrimaryEmail || null,
                primaryPhone: nextPrimaryPhone || null,
            }),
        });
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(data?.error ?? "Mise à jour du client impossible.");
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
            await persistClientDetails();
            const response = await fetch(`${apiBase}/quotes${quote ? `/${quote.id}` : ""}`, {
                method: quote ? "PATCH" : "POST",
                headers: { "content-type": "application/json", "x-user-id": currentUserId },
                body: JSON.stringify({
                    ...form,
                    status: "DRAFT",
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
            return data?.id ?? quote?.id ?? null;
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Enregistrement impossible.");
            return null;
        } finally {
            setPending(false);
        }
    }

    async function saveDraftWithToast() {
        const id = await persistDraft();
        if (!id) return;
        toast.success(quote ? "Brouillon mis à jour." : "Brouillon créé.");
        if (!quote) router.push(`/dashboard/devis/${id}`);
        else router.refresh();
    }

    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await saveDraftWithToast();
    }

    async function validateAndLock() {
        if (!apiBase) return;
        const id = await persistDraft();
        if (!id) return;
        setPending(true);
        try {
            const response = await fetch(`${apiBase}/quotes/${id}/validate`, {
                method: "POST",
                headers: { "x-user-id": currentUserId },
            });
            const data = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) throw new Error(data?.error ?? "Validation impossible.");
            toast.success("Devis validé et verrouillé.");
            setPreviewOpen(false);
            setValidateConfirmOpen(false);
            router.push("/dashboard/devis");
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
        if (!quote) {
            const id = await persistDraft();
            if (!id) return;
            router.replace(`/dashboard/devis/${id}?preview=1`);
            router.refresh();
            return;
        }
        setPreviewOpen(true);
    }

    async function downloadPdf() {
        if (!apiBase || !quote?.id) {
            toast.error("PDF indisponible.");
            return;
        }
        try {
            const response = await fetch(`${apiBase}/quotes/${quote.id}/pdf`, {
                headers: { "x-user-id": currentUserId },
            });
            if (!response.ok) throw new Error("Téléchargement impossible.");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${quote.number}.pdf`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Téléchargement impossible.");
        }
    }

    if (quote && quote.storedStatus !== "DRAFT") {
        return (
            <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:p-8">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Devis verrouillé</p>
                        <p className="mt-1 text-sm">Les informations et les montants ne peuvent plus être modifiés après validation.</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            {quote && quote.storedStatus === "DRAFT" ? (
                <StickyDetailHeader
                    title={quote.number}
                    subtitle={quote.client.name}
                    badgeLabel="Brouillon"
                    returnHref="/dashboard/devis"
                    returnLabel="Retour"
                    actions={
                        <>
                            <Button type="button" variant="outline" className="h-10 rounded-full bg-white px-4" onClick={() => {
                                setValidateConfirmOpen(true);
                            }} disabled={pending}>
                                <LockKeyhole className="h-4 w-4" />
                                Valider
                            </Button>
                            <Button type="button" variant="outline" className="h-10 rounded-full bg-white px-4" onClick={() => {
                                void saveDraftWithToast();
                            }} disabled={pending}>
                                <Save className="h-4 w-4" />
                                Enregistrer le brouillon
                            </Button>
                            <Button type="button" variant="outline" className="h-10 rounded-full bg-white px-4" onClick={() => {
                                void openPreview();
                            }}>
                                <Eye className="h-4 w-4" />
                                Aperçu PDF
                            </Button>
                            <Button type="button" variant="outline" className="h-10 rounded-full bg-white px-4" onClick={() => {
                                void downloadPdf();
                            }}>
                                <Download className="h-4 w-4" />
                                PDF
                            </Button>
                        </>
                    }
                />
            ) : null}
            <form onSubmit={submit} className="space-y-6">
                <section className="grid gap-6 rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_20px_50px_rgba(29,33,49,0.08)] md:grid-cols-2 md:p-7">
                    <div className="md:col-span-2">
                        <p className="text-xs text-slate-500">Les champs obligatoires sont signalés par *</p>
                    </div>
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="clientId">Client</RequiredLabel>
                        <Select
                            value={form.clientId}
                            onValueChange={(value) =>
                                setForm((current) => {
                                    const selectedClient = clients.find((client) => client.id === value);
                                    return {
                                        ...current,
                                        clientId: value,
                                        clientLocation: selectedClient?.location ?? "",
                                        clientAddressLine1: selectedClient?.addressLine1 ?? "",
                                        clientAddressLine2: selectedClient?.addressLine2 ?? "",
                                        clientPostalCode: selectedClient?.postalCode ?? "",
                                        clientCity: selectedClient?.city ?? "",
                                        clientCountry: selectedClient?.country ?? "",
                                        clientSiren: selectedClient?.siren ?? "",
                                        clientVatNumber: selectedClient?.vatNumber ?? "",
                                        clientPrimaryEmail: selectedClient?.primaryEmail ?? "",
                                        clientPrimaryPhone: selectedClient?.primaryPhone ?? "",
                                    };
                                })
                            }
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
                        required
                    />
                    <DateField
                        id="expiryDate"
                        label="Validité"
                        value={form.expiryDate}
                        onChange={(value) => setForm((current) => ({ ...current, expiryDate: value }))}
                        placeholder="Sélectionner une date"
                        required
                    />
                    <div className="space-y-2">
                        <Label htmlFor="clientLocation">Localisation client</Label>
                        <Input
                            id="clientLocation"
                            value={form.clientLocation}
                            onChange={(event) => setForm((current) => ({ ...current, clientLocation: event.target.value }))}
                            placeholder="Ville, pays"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="clientAddressLine1">Adresse client</Label>
                        <Input
                            id="clientAddressLine1"
                            value={form.clientAddressLine1}
                            onChange={(event) => setForm((current) => ({ ...current, clientAddressLine1: event.target.value }))}
                            placeholder="Adresse"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="clientAddressLine2">Complément d’adresse</Label>
                        <Input
                            id="clientAddressLine2"
                            value={form.clientAddressLine2}
                            onChange={(event) => setForm((current) => ({ ...current, clientAddressLine2: event.target.value }))}
                            placeholder="Bâtiment, étage..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientPostalCode">Code postal</Label>
                        <Input
                            id="clientPostalCode"
                            value={form.clientPostalCode}
                            onChange={(event) => setForm((current) => ({ ...current, clientPostalCode: event.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientCity">Ville</Label>
                        <Input
                            id="clientCity"
                            value={form.clientCity}
                            onChange={(event) => setForm((current) => ({ ...current, clientCity: event.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientCountry">Pays</Label>
                        <Input
                            id="clientCountry"
                            value={form.clientCountry}
                            onChange={(event) => setForm((current) => ({ ...current, clientCountry: event.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientSiren">SIREN client</Label>
                        <Input
                            id="clientSiren"
                            value={form.clientSiren}
                            onChange={(event) => setForm((current) => ({ ...current, clientSiren: event.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientVatNumber">TVA client</Label>
                        <Input
                            id="clientVatNumber"
                            value={form.clientVatNumber}
                            onChange={(event) => setForm((current) => ({ ...current, clientVatNumber: event.target.value }))}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientPrimaryEmail">Email client</Label>
                        <Input
                            id="clientPrimaryEmail"
                            type="email"
                            value={form.clientPrimaryEmail}
                            onChange={(event) => setForm((current) => ({ ...current, clientPrimaryEmail: event.target.value }))}
                            placeholder="contact@client.fr"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="clientPrimaryPhone">Téléphone client</Label>
                        <Input
                            id="clientPrimaryPhone"
                            value={form.clientPrimaryPhone}
                            onChange={(event) => setForm((current) => ({ ...current, clientPrimaryPhone: event.target.value }))}
                            placeholder="+33 ..."
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes">Note de fin de page</Label>
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
                            className="h-10 rounded-full px-4"
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
                                        <RequiredLabel htmlFor={`description-${index}`}>Désignation</RequiredLabel>
                                        <Input id={`description-${index}`} value={line.description} onChange={(event) => updateLine(index, "description", event.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor={`quantity-${index}`}>Quantité</RequiredLabel>
                                        <Input id={`quantity-${index}`} inputMode="decimal" value={line.quantity} onChange={(event) => updateLine(index, "quantity", event.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor={`unit-price-${index}`}>Prix HT</RequiredLabel>
                                        <Input id={`unit-price-${index}`} inputMode="decimal" value={line.unitPrice} onChange={(event) => updateLine(index, "unitPrice", event.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor={`vat-${index}`}>TVA %</RequiredLabel>
                                        <Input id={`vat-${index}`} inputMode="decimal" value={line.vatRate} onChange={(event) => updateLine(index, "vatRate", event.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <span className="block text-sm font-medium">Total TTC</span>
                                        <div className="flex h-10 items-center font-semibold text-slate-950">{formatQuoteMoney(calculated.totalCents)}</div>
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
                            <span>{formatQuoteMoney(totals.subtotalCents)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-300">
                            <span>TVA</span>
                            <span>{formatQuoteMoney(totals.vatCents)}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/15 pt-3 text-lg font-semibold">
                            <span>Total TTC</span>
                            <span>{formatQuoteMoney(totals.totalCents)}</span>
                        </div>
                    </div>
                </section>

            </form>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto p-0">
                    <DialogHeader className="border-b px-6 py-5">
                        <DialogTitle>Aperçu PDF</DialogTitle>
                        <DialogDescription>Vérifiez soigneusement les informations avant validation. Après validation, le devis ne pourra plus être modifié.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-6">
                        <div className="relative min-h-[38rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {pdfPreviewLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Chargement du PDF...</div>
                            ) : pdfPreviewUrl ? (
                                <iframe title="Aperçu PDF devis" src={pdfPreviewUrl} className="h-[38rem] w-full" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500">
                                    L’aperçu PDF est indisponible pour le moment.
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="border-t px-6 py-5">
                        <div className="mr-auto flex items-center gap-2 text-sm text-amber-700">
                            <AlertTriangle className="h-4 w-4" />
                            Vérifiez bien le devis avant validation.
                        </div>
                        {quote ? (
                            <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
                                Fermer
                            </Button>
                        ) : null}
                        <Button
                            type="button"
                            className="bg-[#111322] text-white hover:bg-[#191d2e]"
                            disabled={pending}
                            onClick={() => {
                                setValidateConfirmOpen(true);
                            }}
                        >
                            Valider le devis
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={validateConfirmOpen} onOpenChange={setValidateConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Valider le devis ?</DialogTitle>
                        <DialogDescription>Le devis sera verrouillé après validation et ne pourra plus être modifié.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setValidateConfirmOpen(false)} disabled={pending}>
                            Annuler
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={pending}
                            onClick={() => {
                                void validateAndLock();
                            }}
                        >
                            <LockKeyhole className="h-4 w-4" />
                            Valider
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
