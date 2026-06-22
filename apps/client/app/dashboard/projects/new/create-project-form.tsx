"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { getBrowserApiBase } from "@/lib/public-api-base";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type KahierZonePayload = {
    periodes: { id: number; name: string; label: string }[];
    categoriesByPeriode: Record<string, { id: number; name: string }[]>;
};

type KahierZoneCacheEntry = {
    signature: string;
    fetchedAt: number;
    payload: KahierZonePayload;
};

let kahierZoneCache: KahierZoneCacheEntry | null = null;
let kahierZoneLastFetchAt = 0;
const KAHIER_ZONE_CACHE_TTL_MS = 15_000;
const KAHIER_ZONE_FETCH_COOLDOWN_MS = 1_000;

export type ClientOption = {
    id: string;
    name: string;
};

export type OwnerOption = {
    id: string;
    label: string;
    email?: string | null;
};

export type ProjectFormValues = {
    name: string;
    reference: string;
    clientId: string;
    ownerId: string;
    status: ProjectStatusValue;
    priority: ProjectPriorityValue;
    progress: string;
    budgetAmount: string;
    revenueAmount: string;
    costAmount: string;
    invoicedAmount: string;
    receivedAmount: string;
    billingMode: string;
    startDate: string;
    endDate: string;
    description: string;
    context: string;
    goals: string;
    deliverables: string;
    successMetrics: string;
    risks: string;
    notes: string;
    createKahierTask: boolean;
    kahierCategoryId: string;
};

type Props = {
    mode?: "create" | "edit";
    projectId?: string;
    currentUserId: string;
    currentUserRole: "USER" | "MANAGER" | "ADMIN";
    clients: ClientOption[];
    owners: OwnerOption[];
    initialValues?: Partial<ProjectFormValues>;
    onSuccessRedirect?: string;
};

const STATUS_OPTIONS = [
    { value: "DRAFT", label: "En cadrage" },
    { value: "IN_PROGRESS", label: "En production" },
    { value: "ON_HOLD", label: "En pause" },
    { value: "COMPLETED", label: "Clôturé" },
] as const;

const PRIORITY_OPTIONS = [
    { value: "LOW", label: "Basse" },
    { value: "MEDIUM", label: "Moyenne" },
    { value: "HIGH", label: "Haute" },
] as const;

type ProjectStatusValue = (typeof STATUS_OPTIONS)[number]["value"];
type ProjectPriorityValue = (typeof PRIORITY_OPTIONS)[number]["value"];

const textareaClass =
    "border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

const defaultValues = (currentUserId: string): ProjectFormValues => ({
    name: "",
    reference: "",
    clientId: "none",
    ownerId: currentUserId,
    status: "DRAFT",
    priority: "MEDIUM",
    progress: "0",
    budgetAmount: "",
    revenueAmount: "",
    costAmount: "",
    invoicedAmount: "",
    receivedAmount: "",
    billingMode: "",
    startDate: "",
    endDate: "",
    description: "",
    context: "",
    goals: "",
    deliverables: "",
    successMetrics: "",
    risks: "",
    notes: "",
    createKahierTask: false,
    kahierCategoryId: "",
});

function buildInitialValues(currentUserId: string, values?: Partial<ProjectFormValues>): ProjectFormValues {
    const base = defaultValues(currentUserId);
    return { ...base, ...values, ownerId: values?.ownerId ?? base.ownerId, clientId: values?.clientId ?? base.clientId };
}

function OptionalLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
    return (
        <Label htmlFor={htmlFor} className="justify-between gap-3">
            <span>{children}</span>
            <span className="text-xs font-normal uppercase  text-slate-400">Facultatif</span>
        </Label>
    );
}

function DateField({
    id,
    value,
    placeholder,
    disabled,
    onChange,
}: {
    id: string;
    value: string;
    placeholder: string;
    disabled?: boolean;
    onChange: (next: string) => void;
}) {
    const parsedDate = value ? new Date(value) : undefined;
    const selectedDate = parsedDate && Number.isFinite(parsedDate.getTime()) ? parsedDate : undefined;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className="w-full justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        if (!date) {
                            onChange("");
                            return;
                        }
                        onChange(format(date, "yyyy-MM-dd"));
                    }}
                    captionLayout="dropdown"
                />
            </PopoverContent>
        </Popover>
    );
}

export function ProjectForm({
    mode = "create",
    projectId,
    currentUserId,
    currentUserRole,
    clients,
    owners,
    initialValues,
    onSuccessRedirect,
}: Props) {
    const router = useRouter();
    const apiBase = getBrowserApiBase();
    const [pending, setPending] = React.useState(false);
    const [form, setForm] = React.useState<ProjectFormValues>(() => buildInitialValues(currentUserId, initialValues));
    const [kahierTabs, setKahierTabs] = React.useState<{ id: number; name: string; label: string }[]>([]);
    const [kahierCategoriesByTab, setKahierCategoriesByTab] = React.useState<Record<string, { id: number; name: string }[]>>({});
    const [kahierSelectedTabId, setKahierSelectedTabId] = React.useState<string>("");
    const [kahierLoading, setKahierLoading] = React.useState(false);
    const [kahierError, setKahierError] = React.useState<string | null>(null);
    const [kahierApiKey, setKahierApiKey] = React.useState<string>("");
    const [newKahierTabName, setNewKahierTabName] = React.useState("");
    const [newKahierCategoryName, setNewKahierCategoryName] = React.useState("");
    const [creatingKahierTab, setCreatingKahierTab] = React.useState(false);
    const [creatingKahierCategory, setCreatingKahierCategory] = React.useState(false);
    const defaultKahierZoneId = React.useMemo(() => Number(process.env.NEXT_PUBLIC_KAHIER_ZONE_ID ?? 33), []);
    const selectedTabIdRef = React.useRef("");
    const kahierLoadInFlightRef = React.useRef(false);

    React.useEffect(() => {
        setForm(buildInitialValues(currentUserId, initialValues));
    }, [currentUserId, initialValues]);

    React.useEffect(() => {
        selectedTabIdRef.current = kahierSelectedTabId;
    }, [kahierSelectedTabId]);

    React.useEffect(() => {
        let active = true;
        async function loadApiKey() {
            if (!apiBase || !currentUserId) return;
            const local = typeof window !== "undefined" ? window.localStorage.getItem("kahier_api_key") : null;
            if (local?.trim()) {
                if (active) setKahierApiKey(local.trim());
                return;
            }
            try {
                const res = await fetch(`${apiBase}/kahier-link`, {
                    cache: "no-store",
                    headers: { "x-user-id": currentUserId },
                });
                const data = (await res.json().catch(() => null)) as
                    | { connection?: { kahierApiKey?: string | null } | null }
                    | null;
                const key = data?.connection?.kahierApiKey?.trim() ?? "";
                if (!active || !key) return;
                setKahierApiKey(key);
                window.localStorage.setItem("kahier_api_key", key);
            } catch {
                // ignore: feature reste optionnelle
            }
        }
        void loadApiKey();
        return () => {
            active = false;
        };
    }, [apiBase, currentUserId]);

    const resolveKahierApiKey = React.useCallback(async () => {
        const fromState = kahierApiKey.trim();
        if (fromState) return fromState;

        const fromStorage = typeof window !== "undefined" ? window.localStorage.getItem("kahier_api_key")?.trim() : "";
        if (fromStorage) {
            setKahierApiKey(fromStorage);
            return fromStorage;
        }

        if (!apiBase || !currentUserId) return "";
        const res = await fetch(`${apiBase}/kahier-link`, {
            cache: "no-store",
            headers: { "x-user-id": currentUserId },
        });
        const data = (await res.json().catch(() => null)) as
            | { connection?: { kahierApiKey?: string | null } | null; error?: string }
            | null;
        const key = data?.connection?.kahierApiKey?.trim() ?? "";
        if (key) {
            setKahierApiKey(key);
            if (typeof window !== "undefined") {
                window.localStorage.setItem("kahier_api_key", key);
            }
        }
        return key;
    }, [apiBase, currentUserId, kahierApiKey]);

    const applyKahierZonePayload = React.useCallback((payload: KahierZonePayload) => {
        setKahierTabs(payload.periodes);
        setKahierCategoriesByTab(payload.categoriesByPeriode);
        if (!payload.periodes.length) {
            setKahierSelectedTabId("");
            setForm((prev) => ({ ...prev, kahierCategoryId: "" }));
            return;
        }
        const firstTab = payload.periodes[0];
        if (!firstTab) {
            setKahierSelectedTabId("");
            setForm((prev) => ({ ...prev, kahierCategoryId: "" }));
            return;
        }
        const selectedTabStillExists = payload.periodes.some((tab) => String(tab.id) === selectedTabIdRef.current);
        const nextTabId = selectedTabStillExists ? selectedTabIdRef.current : String(firstTab.id);
        setKahierSelectedTabId(nextTabId);
        setForm((prev) => {
            const categories = payload.categoriesByPeriode[nextTabId] ?? [];
            return categories.some((cat) => String(cat.id) === prev.kahierCategoryId)
                ? prev
                : { ...prev, kahierCategoryId: "" };
        });
    }, []);

    const loadKahierCategories = React.useCallback(async (forceRefresh = false) => {
        if (!apiBase || !Number.isFinite(defaultKahierZoneId)) return;
        const resolvedApiKey = await resolveKahierApiKey();
        if (!resolvedApiKey) {
            setKahierError("Clé API Kahier absente pour cet établissement.");
            return;
        }
        const signature = `${apiBase}|${defaultKahierZoneId}|${resolvedApiKey}`;
        const now = Date.now();

        if (!forceRefresh && kahierZoneCache && kahierZoneCache.signature === signature && now - kahierZoneCache.fetchedAt < KAHIER_ZONE_CACHE_TTL_MS) {
            setKahierError(null);
            applyKahierZonePayload(kahierZoneCache.payload);
            return;
        }

        if (kahierLoadInFlightRef.current) return;
        if (!forceRefresh && now - kahierZoneLastFetchAt < KAHIER_ZONE_FETCH_COOLDOWN_MS) return;
        kahierLoadInFlightRef.current = true;
        kahierZoneLastFetchAt = now;
        setKahierLoading(true);
        setKahierError(null);
        try {
            const res = await fetch(`${apiBase}/kahier/zone/${defaultKahierZoneId}`, {
                headers: { "x-api-key": resolvedApiKey },
            });
            const data = (await res.json()) as {
                periodes?: { id: number; name: string; label: string }[];
                categoriesByPeriode?: Record<string, { id: number; name: string }[]>;
                error?: string;
            };
            if (!res.ok || !data.periodes || !data.categoriesByPeriode) {
                throw new Error(data.error ?? "Impossible de récupérer les catégories Kahier.");
            }
            const payload: KahierZonePayload = {
                periodes: data.periodes,
                categoriesByPeriode: data.categoriesByPeriode,
            };
            kahierZoneCache = { signature, fetchedAt: Date.now(), payload };
            applyKahierZonePayload(payload);
        } catch (error) {
            setKahierError(error instanceof Error ? error.message : "Erreur inattendue.");
        } finally {
            kahierLoadInFlightRef.current = false;
            setKahierLoading(false);
        }
    }, [apiBase, defaultKahierZoneId, applyKahierZonePayload, resolveKahierApiKey]);

    React.useEffect(() => {
        void loadKahierCategories(false);
    }, [apiBase, defaultKahierZoneId, kahierApiKey, loadKahierCategories]);

    React.useEffect(() => {
        if (!kahierSelectedTabId) return;
        const categories = kahierCategoriesByTab[kahierSelectedTabId] ?? [];
        if (!categories.length) {
            setForm((prev) => ({ ...prev, kahierCategoryId: "" }));
            return;
        }
        if (!categories.some((cat) => String(cat.id) === form.kahierCategoryId)) {
            setForm((prev) => ({ ...prev, kahierCategoryId: "" }));
        }
    }, [kahierCategoriesByTab, kahierSelectedTabId, form.kahierCategoryId]);

    function update<K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleCreateKahierTab() {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        if (!Number.isFinite(defaultKahierZoneId)) {
            toast.error("Zone Kahier invalide.");
            return;
        }
        const label = newKahierTabName.trim();
        if (!label) {
            toast.error("Saisis un nom d'onglet.");
            return;
        }

        setCreatingKahierTab(true);
        try {
            const resolvedApiKey = await resolveKahierApiKey();
            if (!resolvedApiKey) {
                throw new Error("Clé API Kahier absente pour cet établissement.");
            }
            const response = await fetch(`${apiBase}/kahier/tabs`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": resolvedApiKey,
                },
                body: JSON.stringify({
                    name: label,
                    zoneId: defaultKahierZoneId,
                }),
            });
            const data = (await response.json().catch(() => null)) as { id?: number; error?: string } | null;
            if (!response.ok) {
                throw new Error(data?.error ?? "Impossible de créer l'onglet Kahier.");
            }
            await loadKahierCategories(true);
            if (typeof data?.id === "number") {
                setKahierSelectedTabId(String(data.id));
            }
            setNewKahierTabName("");
            toast.success("Onglet Kahier créé.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur inattendue.");
        } finally {
            setCreatingKahierTab(false);
        }
    }

    async function handleCreateKahierCategory() {
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        if (!kahierSelectedTabId) {
            toast.error("Choisis d'abord un onglet Kahier.");
            return;
        }
        const name = newKahierCategoryName.trim();
        if (!name) {
            toast.error("Saisis un nom de catégorie.");
            return;
        }

        setCreatingKahierCategory(true);
        try {
            const resolvedApiKey = await resolveKahierApiKey();
            if (!resolvedApiKey) {
                throw new Error("Clé API Kahier absente pour cet établissement.");
            }
            const response = await fetch(`${apiBase}/kahier/categories`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": resolvedApiKey,
                },
                body: JSON.stringify({
                    name,
                    tabId: Number(kahierSelectedTabId),
                }),
            });
            const data = (await response.json().catch(() => null)) as { id?: number; error?: string } | null;
            if (!response.ok) {
                throw new Error(data?.error ?? "Impossible de créer la catégorie Kahier.");
            }
            await loadKahierCategories(true);
            if (typeof data?.id === "number") {
                update("kahierCategoryId", String(data.id));
            }
            setNewKahierCategoryName("");
            toast.success("Catégorie Kahier créée.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erreur inattendue.");
        } finally {
            setCreatingKahierCategory(false);
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!currentUserId) {
            toast.error("Utilisateur non authentifié.");
            return;
        }
        if (!apiBase) {
            toast.error("Configuration API manquante.");
            return;
        }
        if (!form.name.trim()) {
            toast.error("Le nom du projet est requis.");
            return;
        }
        if (form.startDate && form.endDate && form.startDate > form.endDate) {
            toast.error("La date de fin doit être après la date de début.");
            return;
        }
        if (mode === "edit" && !projectId) {
            toast.error("Identifiant projet manquant.");
            return;
        }

        setPending(true);
        try {
            const payload = {
                name: form.name.trim(),
                reference: form.reference.trim() || null,
                clientId: form.clientId === "none" ? null : form.clientId,
                ownerId: currentUserRole === "ADMIN" ? form.ownerId : undefined,
                status: form.status,
                priority: form.priority,
                progress: Number(form.progress || "0"),
                budgetAmount: form.budgetAmount.trim() ? Number(form.budgetAmount) : null,
                revenueAmount: form.revenueAmount.trim() ? Number(form.revenueAmount) : null,
                costAmount: form.costAmount.trim() ? Number(form.costAmount) : null,
                invoicedAmount: form.invoicedAmount.trim() ? Number(form.invoicedAmount) : null,
                receivedAmount: form.receivedAmount.trim() ? Number(form.receivedAmount) : null,
                billingMode: form.billingMode.trim() || null,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                description: form.description.trim() || null,
                context: form.context.trim() || null,
                goals: form.goals.trim() || null,
                deliverables: form.deliverables.trim() || null,
                successMetrics: form.successMetrics.trim() || null,
                risks: form.risks.trim() || null,
                notes: form.notes.trim() || null,
            };

            const target = mode === "edit" ? `${apiBase}/projects/${projectId}` : `${apiBase}/projects`;
            const response = await fetch(target, {
                method: mode === "edit" ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": currentUserId,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.error ?? (mode === "edit" ? "Impossible de mettre à jour le projet." : "Impossible de créer le projet."));
            }

            if (mode === "create" && form.createKahierTask && form.kahierCategoryId) {
                const resolvedApiKey = await resolveKahierApiKey();
                if (!resolvedApiKey) {
                    throw new Error("Clé API Kahier absente pour cet établissement.");
                }
                const taskRes = await fetch(`${apiBase}/kahier/tasks`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": resolvedApiKey,
                    },
                    body: JSON.stringify({
                        name: form.name.trim(),
                        categoryId: Number(form.kahierCategoryId),
                        assignedUserIds: [],
                        daysOfWeek: [],
                        displayOrder: 0,
                        positionAfterId: "",
                        isRecurring: false,
                        endDate: null,
                        reminder_1: null,
                        reminder_2: null,
                        reminder_3: null,
                        priority: null,
                    }),
                });
                if (!taskRes.ok) {
                    const taskData = await taskRes.json().catch(() => null);
                    toast.error(taskData?.error ?? "Projet créé, mais la tâche Kahier n'a pas pu être créée.");
                } else {
                    toast.success("Tâche Kahier liée au projet créée.");
                }
            }

            toast.success(mode === "edit" ? "Projet mis à jour." : "Projet créé.");
            router.push(onSuccessRedirect ?? (mode === "edit" && projectId ? `/dashboard/projects/${projectId}` : "/dashboard/projects"));
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur inattendue.";
            toast.error(message);
        } finally {
            setPending(false);
        }
    }

    return (
        <form id="project-form" className="space-y-6" onSubmit={handleSubmit}>
            <Card className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-950">Identification</CardTitle>
                    <CardDescription>Nom, référence, client et pilotage principal.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="project-name">Nom du projet</Label>
                        <Input
                            id="project-name"
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            placeholder="Ex. Refonte extranet client"
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-reference">Référence interne</OptionalLabel>
                        <Input
                            id="project-reference"
                            value={form.reference}
                            onChange={(e) => update("reference", e.target.value)}
                            placeholder="Ex. PROJ-2026-014"
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel>Client</OptionalLabel>
                        <Select value={form.clientId} onValueChange={(value) => update("clientId", value)} disabled={pending}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sans client" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Sans client</SelectItem>
                                {clients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel>Responsable</OptionalLabel>
                        <Select
                            value={form.ownerId}
                            onValueChange={(value) => update("ownerId", value)}
                            disabled={pending || currentUserRole !== "ADMIN"}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {owners.map((owner) => (
                                    <SelectItem key={owner.id} value={owner.id}>
                                        {owner.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <OptionalLabel htmlFor="project-description">Résumé du projet</OptionalLabel>
                        <textarea
                            id="project-description"
                            className={textareaClass}
                            value={form.description}
                            onChange={(e) => update("description", e.target.value)}
                            placeholder="Décris brièvement l'objectif et le périmètre."
                            disabled={pending}
                        />
                    </div>
                    {mode === "create" ? (
                        <div className="space-y-2 md:col-span-2">
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-[#f8f9fd] px-3 py-3">
                                <Checkbox
                                    id="create-kahier-task"
                                    checked={form.createKahierTask}
                                    onCheckedChange={(checked) => update("createKahierTask", checked === true)}
                                    disabled={pending}
                                />
                                <Label htmlFor="create-kahier-task" className="cursor-pointer">
                                    Créer une tâche Kahier liée à ce projet
                                </Label>
                            </div>

                            {form.createKahierTask ? (
                                <>
                                    <OptionalLabel>Catégorie tâche Kahier</OptionalLabel>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <Select
                                            value={kahierSelectedTabId}
                                            onValueChange={(value) => setKahierSelectedTabId(value)}
                                            disabled={pending || kahierLoading || kahierTabs.length === 0}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Onglet Kahier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {kahierTabs.map((tab) => (
                                                    <SelectItem key={tab.id} value={String(tab.id)}>
                                                        {tab.label || tab.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={form.kahierCategoryId}
                                            onValueChange={(value) => update("kahierCategoryId", value)}
                                            disabled={pending || kahierLoading || !kahierSelectedTabId}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Catégorie Kahier (optionnel)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(kahierCategoriesByTab[kahierSelectedTabId] ?? []).map((category) => (
                                                    <SelectItem key={category.id} value={String(category.id)}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="flex gap-2">
                                            <Input
                                                value={newKahierTabName}
                                                onChange={(e) => setNewKahierTabName(e.target.value)}
                                                placeholder="Créer un onglet Kahier"
                                                disabled={pending || kahierLoading || creatingKahierTab}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="shrink-0"
                                                onClick={() => void handleCreateKahierTab()}
                                                disabled={pending || kahierLoading || creatingKahierTab}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Onglet
                                            </Button>
                                        </div>
                                        <div className="flex gap-2">
                                            <Input
                                                value={newKahierCategoryName}
                                                onChange={(e) => setNewKahierCategoryName(e.target.value)}
                                                placeholder="Créer une catégorie Kahier"
                                                disabled={pending || kahierLoading || !kahierSelectedTabId || creatingKahierCategory}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="shrink-0"
                                                onClick={() => void handleCreateKahierCategory()}
                                                disabled={pending || kahierLoading || !kahierSelectedTabId || creatingKahierCategory}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Catégorie
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Si une catégorie est choisie, une tâche Kahier sera créée automatiquement à la création du projet.
                                    </p>
                                    {kahierError ? <p className="text-xs text-slate-700">{kahierError}</p> : null}
                                </>
                            ) : null}
                        </div>
                    ) : null}
                </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-950">Pilotage</CardTitle>
                    <CardDescription>Statut, priorité, budget, rythme et dates de référence.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Statut</Label>
                        <Select value={form.status} onValueChange={(value) => update("status", value as ProjectStatusValue)} disabled={pending}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Priorité</Label>
                        <Select value={form.priority} onValueChange={(value) => update("priority", value as ProjectPriorityValue)} disabled={pending}>
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PRIORITY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="project-progress">Progression initiale</Label>
                        <Input
                            id="project-progress"
                            type="number"
                            min="0"
                            max="100"
                            value={form.progress}
                            onChange={(e) => update("progress", e.target.value)}
                            placeholder="0"
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-budget">Budget estimé</OptionalLabel>
                        <Input
                            id="project-budget"
                            type="number"
                            min="0"
                            value={form.budgetAmount}
                            onChange={(e) => update("budgetAmount", e.target.value)}
                            placeholder="15000"
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-revenue">Revenu prévisionnel</OptionalLabel>
                        <Input
                            id="project-revenue"
                            type="number"
                            min="0"
                            value={form.revenueAmount}
                            onChange={(e) => update("revenueAmount", e.target.value)}
                            placeholder="22000"
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-cost">Coût projet</OptionalLabel>
                        <Input
                            id="project-cost"
                            type="number"
                            min="0"
                            value={form.costAmount}
                            onChange={(e) => update("costAmount", e.target.value)}
                            placeholder="14000"
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-invoiced">Montant facturé</OptionalLabel>
                        <Input
                            id="project-invoiced"
                            type="number"
                            min="0"
                            value={form.invoicedAmount}
                            onChange={(e) => update("invoicedAmount", e.target.value)}
                            placeholder="12000"
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-received">Montant encaissé</OptionalLabel>
                        <Input
                            id="project-received"
                            type="number"
                            min="0"
                            value={form.receivedAmount}
                            onChange={(e) => update("receivedAmount", e.target.value)}
                            placeholder="9000"
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-billing">Mode de facturation</OptionalLabel>
                        <Input
                            id="project-billing"
                            value={form.billingMode}
                            onChange={(e) => update("billingMode", e.target.value)}
                            placeholder="Forfait, régie, abonnement..."
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-start-date">Date de début</OptionalLabel>
                        <DateField
                            id="project-start-date"
                            value={form.startDate}
                            placeholder="Choisir une date"
                            disabled={pending}
                            onChange={(next) => update("startDate", next)}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-end-date">Date de fin</OptionalLabel>
                        <DateField
                            id="project-end-date"
                            value={form.endDate}
                            placeholder="Choisir une date"
                            disabled={pending}
                            onChange={(next) => update("endDate", next)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-950">Cadrage</CardTitle>
                    <CardDescription>Contexte, objectifs, livrables attendus et critères de réussite.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-context">Contexte</OptionalLabel>
                        <textarea
                            id="project-context"
                            className={textareaClass}
                            value={form.context}
                            onChange={(e) => update("context", e.target.value)}
                            placeholder="Contexte business, historique, demande initiale, contraintes d'organisation..."
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-goals">Objectifs</OptionalLabel>
                        <textarea
                            id="project-goals"
                            className={textareaClass}
                            value={form.goals}
                            onChange={(e) => update("goals", e.target.value)}
                            placeholder="Objectifs opérationnels, résultats attendus, impact métier..."
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-deliverables">Livrables</OptionalLabel>
                        <textarea
                            id="project-deliverables"
                            className={textareaClass}
                            value={form.deliverables}
                            onChange={(e) => update("deliverables", e.target.value)}
                            placeholder="Maquettes, dashboard, documentation, migration, formation..."
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-metrics">Critères de réussite</OptionalLabel>
                        <textarea
                            id="project-metrics"
                            className={textareaClass}
                            value={form.successMetrics}
                            onChange={(e) => update("successMetrics", e.target.value)}
                            placeholder="Adoption, délai, qualité, gain de temps, KPI de livraison..."
                            disabled={pending}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition">
                <CardHeader>
                    <CardTitle className="text-lg text-slate-950">Risques et notes</CardTitle>
                    <CardDescription>Points de vigilance, dépendances et notes internes de suivi.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-risks">Risques</OptionalLabel>
                        <textarea
                            id="project-risks"
                            className={textareaClass}
                            value={form.risks}
                            onChange={(e) => update("risks", e.target.value)}
                            placeholder="Dépendances externes, charge équipe, délai, qualité des données..."
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2">
                        <OptionalLabel htmlFor="project-notes">Notes internes</OptionalLabel>
                        <textarea
                            id="project-notes"
                            className={textareaClass}
                            value={form.notes}
                            onChange={(e) => update("notes", e.target.value)}
                            placeholder="Informations internes, arbitrages, points d'attention, décisions..."
                            disabled={pending}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" className="h-10 rounded-full border border-[#11131d] bg-[#11131d] px-6 text-white hover:bg-black" disabled={pending}>
                    {pending ? (mode === "edit" ? "Mise à jour..." : "Création...") : mode === "edit" ? "Mettre à jour le projet" : "Créer le projet"}
                </Button>
            </div>
        </form>
    );
}

export function CreateProjectForm(props: Omit<Props, "mode">) {
    return <ProjectForm {...props} mode="create" />;
}
