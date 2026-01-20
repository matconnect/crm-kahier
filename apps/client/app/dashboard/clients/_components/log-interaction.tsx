"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronDown, Mail, MessageSquare, PhoneCall, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const typeOptions = [
    { value: "Email", label: "Email", icon: Mail },
    { value: "Appel", label: "Appel", icon: PhoneCall },
    { value: "Réunion", label: "Réunion", icon: Calendar },
    { value: "Note", label: "Note", icon: MessageSquare },
] as const;

type Props = {
    clientId: string;
    currentUserId: string;
};

type CollaboratorOption = {
    id: string;
    label: string;
    email?: string | null;
};

function formatTime(value: Date) {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function roundToStep(date: Date, stepMinutes = 30) {
    const ms = 1000 * 60 * stepMinutes;
    return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function normalizeSearch(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

type KahierPeriodeTab = {
    id: number;
    name: string;
    label: string;
};

type KahierCategory = {
    id: number;
    name: string;
    displayOrder: number;
    periodeTabId: number;
    color?: string | null;
};

export function LogInteraction({ clientId, currentUserId }: Props) {
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    const kahierZoneId = Number(process.env.NEXT_PUBLIC_KAHIER_ZONE_ID ?? 33);
    const router = useRouter();
    const [pending, setPending] = React.useState(false);
    const [type, setType] = React.useState<string>("Email");
    const [summary, setSummary] = React.useState("");
    const [occurredDate, setOccurredDate] = React.useState<Date | undefined>(() => new Date());
    const [occurredTime, setOccurredTime] = React.useState<string>(() => {
        const now = roundToStep(new Date());
        return formatTime(now);
    });
    const [meetingDate, setMeetingDate] = React.useState<Date | undefined>(() => new Date());
    const [meetingStartTime, setMeetingStartTime] = React.useState<string>(() => {
        const now = roundToStep(new Date());
        return formatTime(now);
    });
    const [meetingEndTime, setMeetingEndTime] = React.useState<string>(() => {
        const now = roundToStep(new Date());
        now.setHours(now.getHours() + 1);
        return formatTime(now);
    });
    const [collaborators, setCollaborators] = React.useState<CollaboratorOption[]>([]);
    const [collaboratorIds, setCollaboratorIds] = React.useState<string[]>([]);
    const [meetingOpen, setMeetingOpen] = React.useState(false);
    const [occurredOpen, setOccurredOpen] = React.useState(false);
    const [collaboratorsOpen, setCollaboratorsOpen] = React.useState(false);
    const [collaboratorQuery, setCollaboratorQuery] = React.useState("");
    const filteredCollaborators = React.useMemo(() => {
        const query = normalizeSearch(collaboratorQuery);
        if (query.length === 0) return collaborators;
        return collaborators.filter((user) => normalizeSearch(user.label ?? "").includes(query));
    }, [collaborators, collaboratorQuery]);
    const [createTask, setCreateTask] = React.useState(false);
    const [tabs, setTabs] = React.useState<KahierPeriodeTab[]>([]);
    const [categoriesByTab, setCategoriesByTab] = React.useState<Record<string, KahierCategory[]>>({});
    const [selectedTabId, setSelectedTabId] = React.useState<string>("");
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
    const [tabsLoading, setTabsLoading] = React.useState(false);
    const [tabsError, setTabsError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let active = true;
        async function loadCollaborators() {
            if (!apiBase || !currentUserId) return;
            try {
                const res = await fetch(`${apiBase}/users`, {
                    headers: { "x-user-id": currentUserId },
                });
                const data = (await res.json()) as { users?: CollaboratorOption[] };
                if (!res.ok || !data.users) return;
                if (active) setCollaborators(data.users);
            } catch {
                // ignore
            }
        }
        void loadCollaborators();
        return () => {
            active = false;
        };
    }, [apiBase, currentUserId]);

    React.useEffect(() => {
        let active = true;
        async function loadTabs() {
            if (!createTask || !kahierZoneId) return;
            if (!apiBase) {
                setTabsError("NEXT_PUBLIC_API_URL manquant.");
                return;
            }
            setTabsLoading(true);
            setTabsError(null);
            try {
                const res = await fetch(`${apiBase}/kahier/zone/${kahierZoneId}`);
                const data = (await res.json()) as {
                    periodes?: KahierPeriodeTab[];
                    categoriesByPeriode?: Record<string, KahierCategory[]>;
                    error?: string;
                };
                if (!res.ok || !data.periodes || !data.categoriesByPeriode) {
                    throw new Error(data.error ?? "Impossible de récupérer les onglets.");
                }
                if (!active) return;
                setTabs(data.periodes);
                setCategoriesByTab(data.categoriesByPeriode);
                if (!selectedTabId && data.periodes[0]) {
                    const firstId = String(data.periodes[0].id);
                    setSelectedTabId(firstId);
                    const firstCategories = data.categoriesByPeriode[firstId] ?? [];
                    setSelectedCategoryId(firstCategories[0] ? String(firstCategories[0].id) : "");
                }
            } catch (error) {
                if (!active) return;
                setTabsError(error instanceof Error ? error.message : "Erreur inattendue.");
            } finally {
                if (active) setTabsLoading(false);
            }
        }
        void loadTabs();
        return () => {
            active = false;
        };
    }, [apiBase, createTask, kahierZoneId]);

    React.useEffect(() => {
        if (!selectedTabId) return;
        const categories = categoriesByTab[selectedTabId] ?? [];
        if (!categories.length) {
            setSelectedCategoryId("");
            return;
        }
        if (!selectedCategoryId || !categories.some((cat) => String(cat.id) === selectedCategoryId)) {
            setSelectedCategoryId(String(categories[0].id));
        }
    }, [categoriesByTab, selectedCategoryId, selectedTabId]);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!type) {
            toast.error("Choisis un type d'interaction.");
            return;
        }
        if (!summary.trim()) {
            toast.error("Ajoute une note pour l'interaction.");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur non authentifié.");
            return;
        }
        if (type === "Réunion") {
            if (!meetingDate || !meetingStartTime || !meetingEndTime) {
                toast.error("Renseigne l'heure de début et de fin.");
                return;
            }
            const meetingDateValue = format(meetingDate, "yyyy-MM-dd");
            const start = new Date(`${meetingDateValue}T${meetingStartTime}:00`);
            const end = new Date(`${meetingDateValue}T${meetingEndTime}:00`);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                toast.error("Horaires de réunion invalides.");
                return;
            }
            if (end.getTime() <= start.getTime()) {
                toast.error("L'heure de fin doit être après l'heure de début.");
                return;
            }
        }

        if (!occurredDate || !occurredTime) {
            toast.error("Renseigne la date et l'heure.");
            return;
        }
        setPending(true);
        try {
            const occurredDateValue = format(occurredDate, "yyyy-MM-dd");
            const meetingPayload =
                type === "Réunion"
                    ? {
                        meetingStart: new Date(
                            `${format(meetingDate as Date, "yyyy-MM-dd")}T${meetingStartTime}:00`
                        ).toISOString(),
                        meetingEnd: new Date(
                            `${format(meetingDate as Date, "yyyy-MM-dd")}T${meetingEndTime}:00`
                        ).toISOString(),
                    }
                    : {};
            const occurredAtIso =
                type === "Réunion"
                    ? new Date(
                        `${format(meetingDate as Date, "yyyy-MM-dd")}T${meetingStartTime}:00`
                    ).toISOString()
                    : new Date(`${occurredDateValue}T${occurredTime}:00`).toISOString();
            const res = await fetch(`${apiBase}/clients/${clientId}/interactions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": currentUserId,
                },
                body: JSON.stringify({
                    type,
                    summary: summary.trim() || null,
                    occurredAt: occurredAtIso,
                    userId: currentUserId,
                    collaboratorIds,
                    ...meetingPayload,
                }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(data?.error ?? "Impossible d'enregistrer l'interaction");
            }
            toast.success("Interaction enregistrée");
            setSummary("");
            setCollaboratorIds([]);
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Erreur inattendue";
            toast.error(message);
        } finally {
            setPending(false);
        }
    }

    return (
        <Card className="border-muted/60">
            <CardHeader>
                <CardTitle className="text-base">Nouvelle interaction</CardTitle>
                <CardDescription>Log un email, appel, réunion ou note avec ce client.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="grid gap-3 sm:grid-cols-3" onSubmit={onSubmit}>
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={setType} disabled={pending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choisir un type" />
                            </SelectTrigger>
                            <SelectContent>
                                {typeOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        <div className="inline-flex items-center gap-2">
                                            <opt.icon className="h-4 w-4" />
                                            {opt.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Note</Label>
                        <Input
                            placeholder="Ex : Email de relance signé"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            disabled={pending}
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-3">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground">
                            <input
                                type="checkbox"
                                checked={createTask}
                                onChange={(e) => setCreateTask(e.target.checked)}
                                disabled={pending}
                            />
                            Créer une tâche sur Kahier
                        </label>
                        {createTask && tabsError && <p className="text-xs text-destructive">{tabsError}</p>}
                        {createTask && tabsLoading && <p className="text-xs text-muted-foreground">Chargement des onglets…</p>}
                    </div>
                    {createTask && (
                        <>
                            <div className="space-y-2">
                                <Label>Onglet</Label>
                                <Select
                                    value={selectedTabId}
                                    onValueChange={setSelectedTabId}
                                    disabled={pending || tabsLoading || tabs.length === 0}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir un onglet" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tabs.map((tab) => (
                                            <SelectItem key={tab.id} value={String(tab.id)}>
                                                {tab.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Catégorie</Label>
                                <Select
                                    value={selectedCategoryId}
                                    onValueChange={setSelectedCategoryId}
                                    disabled={
                                        pending ||
                                        tabsLoading ||
                                        !selectedTabId ||
                                        (categoriesByTab[selectedTabId]?.length ?? 0) === 0
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(categoriesByTab[selectedTabId] ?? []).map((category) => (
                                            <SelectItem key={category.id} value={String(category.id)}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                    {type === "Réunion" ? (
                        <div className="space-y-2">
                            <Label>Horaire de réunion</Label>
                            <div className="grid gap-2 sm:grid-cols-3">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground">Date</Label>
                                    <Popover open={meetingOpen} onOpenChange={setMeetingOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {meetingDate ? format(meetingDate, "P") : "Choisir une date"}
                                                <ChevronDown className="h-4 w-4 opacity-60" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarPicker
                                                mode="single"
                                                selected={meetingDate}
                                                onSelect={(date) => {
                                                    setMeetingDate(date);
                                                    setMeetingOpen(false);
                                                }}
                                                captionLayout="dropdown"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground">Début</Label>
                                    <Input
                                        type="time"
                                        value={meetingStartTime}
                                        onChange={(e) => setMeetingStartTime(e.target.value)}
                                        disabled={pending}
                                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs text-muted-foreground">Fin</Label>
                                    <Input
                                        type="time"
                                        value={meetingEndTime}
                                        onChange={(e) => setMeetingEndTime(e.target.value)}
                                        disabled={pending}
                                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Quand</Label>
                            <div className="flex gap-3">
                                <div className="space-y-2 w-1/4">
                                    <Label className="text-xs text-muted-foreground">Date</Label>
                                    <Popover open={occurredOpen} onOpenChange={setOccurredOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                {occurredDate ? format(occurredDate, "P") : "Choisir une date"}
                                                <ChevronDown className="h-4 w-4 opacity-60" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <CalendarPicker
                                                mode="single"
                                                selected={occurredDate}
                                                onSelect={(date) => {
                                                    setOccurredDate(date);
                                                    setOccurredOpen(false);
                                                }}
                                                captionLayout="dropdown"
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2 w-3/4">
                                    <Label className="text-xs text-muted-foreground">Heure</Label>
                                    <Input
                                        type="time"
                                        value={occurredTime}
                                        onChange={(e) => setOccurredTime(e.target.value)}
                                        disabled={pending}
                                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>
                            {`Collaborateurs concernés (optionnel)${collaboratorIds.length > 0
                                ? ` · ${collaboratorIds.length} sélectionné${collaboratorIds.length > 1 ? "s" : ""
                                }`
                                : ""
                                }`}
                        </Label>
                        {collaborators.length === 0 ? (
                            <div className="text-xs text-muted-foreground">Aucun collaborateur disponible.</div>
                        ) : (
                            <Popover open={collaboratorsOpen} onOpenChange={setCollaboratorsOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between font-normal">
                                        {collaboratorIds.length
                                            ? collaborators
                                                .filter((user) => collaboratorIds.includes(user.id))
                                                .slice(0, 3)
                                                .map((user) => user.label)
                                                .join(", ")
                                            : "Sélectionner des collaborateurs"}
                                        <ChevronDown className="h-4 w-4 opacity-60" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-72 p-2" align="start">
                                    <div className="space-y-2">
                                        <Input
                                            placeholder="Rechercher un collaborateur..."
                                            value={collaboratorQuery}
                                            onChange={(e) => setCollaboratorQuery(e.target.value)}
                                        />
                                        <div className="flex items-center justify-center gap-2 rounded-md border bg-muted/40 p-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs"
                                                onClick={() =>
                                                    setCollaboratorIds(filteredCollaborators.map((user) => user.id))
                                                }
                                            >
                                                Tout cocher
                                            </Button>
                                            <span className="h-4 w-px bg-border" aria-hidden />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-xs"
                                                onClick={() => setCollaboratorIds([])}
                                            >
                                                Tout décocher
                                            </Button>
                                        </div>
                                        <div
                                            className="max-h-28 overflow-y-auto"
                                            onWheel={(e) => {
                                                e.currentTarget.scrollTop += e.deltaY;
                                            }}
                                        >
                                            {filteredCollaborators.map((user) => {
                                                const active = collaboratorIds.includes(user.id);
                                                return (
                                                    <label
                                                        key={user.id}
                                                        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                                                    >
                                                        <Checkbox
                                                            checked={active}
                                                            onCheckedChange={(checked) => {
                                                                setCollaboratorIds((prev) => {
                                                                    const next = new Set(prev);
                                                                    if (checked) {
                                                                        next.add(user.id);
                                                                    } else {
                                                                        next.delete(user.id);
                                                                    }
                                                                    return Array.from(next);
                                                                });
                                                            }}
                                                        />
                                                        <span className="text-sm">{user.label}</span>
                                                    </label>
                                                );
                                            })}
                                            {filteredCollaborators.length === 0 && (
                                                <div className="text-xs text-muted-foreground px-2 py-1.5">
                                                    Aucun résultat.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" className="gap-2" disabled={pending}>
                            <Send className="h-4 w-4" />
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
