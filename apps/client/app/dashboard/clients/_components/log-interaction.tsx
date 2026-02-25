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
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserPicker, type PickerOption } from "@/components/ui/user-picker";

const typeOptions = [
    { value: "Email", label: "Email", icon: Mail },
    { value: "Appel", label: "Appel", icon: PhoneCall },
    { value: "Réunion", label: "Réunion", icon: Calendar },
    { value: "Note", label: "Note", icon: MessageSquare },
] as const;

type Props = {
    clientId: string;
    currentUserId: string;
    enabled?: boolean;
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

type KahierUser = {
    id: number;
    firstname: string;
    lastname: string;
    role: string;
    email: string;
    avatar: string | null;
    color: string | null;
    zones: { id: number; name: string }[];
};

type KahierPlanning = {
    id: number;
    name: string;
    type: string;
    color: string | null;
};

type KahierLegend = {
    id: number;
    label: string;
    color: string;
    planningId: number;
};


export function LogInteraction({ clientId, currentUserId, enabled = true }: Props) {
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
    const [createTask, setCreateTask] = React.useState(false);
    const [openSections, setOpenSections] = React.useState<string[]>(["interaction", "planning"]);
    const [tabs, setTabs] = React.useState<KahierPeriodeTab[]>([]);
    const [categoriesByTab, setCategoriesByTab] = React.useState<Record<string, KahierCategory[]>>({});
    const [selectedTabId, setSelectedTabId] = React.useState<string>("");
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("");
    const [tabsLoading, setTabsLoading] = React.useState(false);
    const [tabsError, setTabsError] = React.useState<string | null>(null);
    const [kahierUsers, setKahierUsers] = React.useState<KahierUser[]>([]);
    const [usersLoading, setUsersLoading] = React.useState(false);
    const [usersError, setUsersError] = React.useState<string | null>(null);
    const [assignedUserIds, setAssignedUserIds] = React.useState<string[]>([]);
    const [assignedOpen, setAssignedOpen] = React.useState(false);
    const [assignedQuery, setAssignedQuery] = React.useState("");
    const [isTaskRecurring, setIsTaskRecurring] = React.useState(false);
    const [taskEndDate, setTaskEndDate] = React.useState<Date | undefined>(undefined);
    const [taskEndOpen, setTaskEndOpen] = React.useState(false);
    const [plannings, setPlannings] = React.useState<KahierPlanning[]>([]);
    const [planningsLoading, setPlanningsLoading] = React.useState(false);
    const [planningsError, setPlanningsError] = React.useState<string | null>(null);
    const [selectedPlanningId, setSelectedPlanningId] = React.useState<string>("");
    const [legends, setLegends] = React.useState<KahierLegend[]>([]);
    const [legendsLoading, setLegendsLoading] = React.useState(false);
    const [legendsError, setLegendsError] = React.useState<string | null>(null);
    const [selectedLegendId, setSelectedLegendId] = React.useState<string>("");
    const [planningUserIds, setPlanningUserIds] = React.useState<string[]>([]);
    const [planningUsersOpen, setPlanningUsersOpen] = React.useState(false);
    const [planningUsersQuery, setPlanningUsersQuery] = React.useState("");
    const [planningTitle, setPlanningTitle] = React.useState("");
    const [planningDescription, setPlanningDescription] = React.useState("");

    React.useEffect(() => {
        if (!enabled) return;
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
    }, [apiBase, currentUserId, enabled]);

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
    }, [apiBase, createTask, kahierZoneId, selectedTabId]);

    React.useEffect(() => {
        let active = true;
        async function loadUsers() {
            if (!createTask && !openSections.includes("kahier-planning")) return;
            if (!apiBase) {
                setUsersError("NEXT_PUBLIC_API_URL manquant.");
                return;
            }
            setUsersLoading(true);
            setUsersError(null);
            try {
                const res = await fetch(`${apiBase}/kahier/users`);
                const data = (await res.json()) as KahierUser[];
                if (!res.ok || !Array.isArray(data)) {
                    throw new Error("Impossible de récupérer les utilisateurs.");
                }
                if (!active) return;
                setKahierUsers(data);
            } catch (error) {
                if (!active) return;
                setUsersError(error instanceof Error ? error.message : "Erreur inattendue.");
            } finally {
                if (active) setUsersLoading(false);
            }
        }
        void loadUsers();
        return () => {
            active = false;
        };
    }, [apiBase, createTask, openSections]);

    React.useEffect(() => {
        let active = true;
        async function loadPlannings() {
            if (!openSections.includes("kahier-planning")) return;
            if (!apiBase) {
                setPlanningsError("NEXT_PUBLIC_API_URL manquant.");
                return;
            }
            setPlanningsLoading(true);
            setPlanningsError(null);
            try {
                const res = await fetch(`${apiBase}/kahier/plannings`);
                const data = (await res.json()) as KahierPlanning[];
                if (!res.ok || !Array.isArray(data)) {
                    throw new Error("Impossible de récupérer les plannings.");
                }
                if (!active) return;
                setPlannings(data);
            } catch (error) {
                if (!active) return;
                setPlanningsError(error instanceof Error ? error.message : "Erreur inattendue.");
            } finally {
                if (active) setPlanningsLoading(false);
            }
        }
        void loadPlannings();
        return () => {
            active = false;
        };
    }, [apiBase, openSections]);

    React.useEffect(() => {
        let active = true;
        async function loadLegends() {
            if (!openSections.includes("kahier-planning")) return;
            if (!selectedPlanningId) return;
            if (!apiBase) {
                setLegendsError("NEXT_PUBLIC_API_URL manquant.");
                return;
            }
            const selectedPlanning = plannings.find((planning) => String(planning.id) === selectedPlanningId);
            const mode = selectedPlanning?.type ?? "classic";
            setLegendsLoading(true);
            setLegendsError(null);
            try {
                const res = await fetch(
                    `${apiBase}/kahier/plannings/${selectedPlanningId}/legends?mode=${encodeURIComponent(mode)}`
                );
                const data = (await res.json()) as KahierLegend[];
                if (!res.ok || !Array.isArray(data)) {
                    throw new Error("Impossible de récupérer les légendes.");
                }
                if (!active) return;
                setLegends(data);
            } catch (error) {
                if (!active) return;
                setLegendsError(error instanceof Error ? error.message : "Erreur inattendue.");
            } finally {
                if (active) setLegendsLoading(false);
            }
        }
        void loadLegends();
        return () => {
            active = false;
        };
    }, [apiBase, openSections, plannings, selectedPlanningId]);

    React.useEffect(() => {
        setSelectedLegendId("");
    }, [selectedPlanningId]);

    React.useEffect(() => {
        if (!selectedTabId) return;
        const categories = categoriesByTab[selectedTabId] ?? [];
        if (!categories.length) {
            setSelectedCategoryId("");
            return;
        }
        if (!selectedCategoryId || !categories.some((cat) => String(cat.id) === selectedCategoryId)) {
            const firstCategory = categories[0];
            if (firstCategory) {
                setSelectedCategoryId(String(firstCategory.id));
            }
        }
    }, [categoriesByTab, selectedCategoryId, selectedTabId]);

    React.useEffect(() => {
        if (!createTask) {
            setAssignedUserIds([]);
        }
    }, [createTask]);

    React.useEffect(() => {
        if (!openSections.includes("kahier-planning")) {
            setSelectedPlanningId("");
            setSelectedLegendId("");
            setPlanningUserIds([]);
            setPlanningTitle("");
            setPlanningDescription("");
        }
    }, [openSections]);

    React.useEffect(() => {
        if (!openSections.includes("kahier-planning")) return;
        if (!planningDescription) {
            setPlanningDescription(summary.trim());
        }
    }, [openSections, planningDescription, summary]);

    React.useEffect(() => {
        if (isTaskRecurring) {
            setTaskEndDate(undefined);
        }
    }, [isTaskRecurring]);

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
        if (createTask) {
            if (!selectedCategoryId) {
                toast.error("Choisis une catégorie Kahier.");
                return;
            }
            if (assignedUserIds.length === 0) {
                toast.error("Choisis un assigné pour la tâche Kahier.");
                return;
            }
            if (!isTaskRecurring && !taskEndDate) {
                toast.error("Choisis une date de fin pour la tâche Kahier.");
                return;
            }
        }
        if (openSections.includes("kahier-planning")) {
            if (!planningTitle.trim()) {
                toast.error("Ajoute un titre pour le planning.");
                return;
            }
            if (!planningDescription.trim()) {
                toast.error("Ajoute une description pour le planning.");
                return;
            }
            if (!selectedPlanningId) {
                toast.error("Choisis un planning Kahier.");
                return;
            }
            if (!selectedLegendId) {
                toast.error("Choisis une légende pour le planning.");
                return;
            }
            if (planningUserIds.length === 0) {
                toast.error("Choisis au moins un utilisateur pour le planning.");
                return;
            }
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
            if (createTask) {
                const taskRes = await fetch(`${apiBase}/kahier/tasks`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: summary.trim() || `${type} ${format(new Date(), "Pp")}`,
                        categoryId: Number(selectedCategoryId),
                        assignedUserIds: assignedUserIds.map((id) => Number(id)),
                        daysOfWeek: [],
                        displayOrder: 0,
                        positionAfterId: "",
                        isRecurring: isTaskRecurring,
                            endDate: !isTaskRecurring && taskEndDate ? format(taskEndDate, "yyyy-MM-dd") : null,
                        reminder_1: null,
                        reminder_2: null,
                        reminder_3: null,
                        priority: null,
                    }),
                });
                if (!taskRes.ok) {
                    const taskData = await taskRes.json().catch(() => null);
                    toast.error(taskData?.error ?? "Tâche Kahier non créée.");
                } else {
                    toast.success("Tâche Kahier créée");
                }
            }
            if (openSections.includes("kahier-planning")) {
                const planningDate = type === "Réunion" ? meetingDate : occurredDate;
                const legend = legends.find((item) => String(item.id) === selectedLegendId);
                const planningLabel = planningTitle.trim() || legend?.label || "Planning";
                const planningColor = legend?.color ?? "bg-gray-500";
                const dateValue = planningDate ? format(planningDate, "yyyy-MM-dd") : occurredDateValue;
                const planningRes = await fetch(`${apiBase}/kahier/planning`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        selectedRoomId: null,
                        title: planningLabel,
                        description: planningDescription.trim(),
                        color: planningColor,
                        colorId: Number(selectedLegendId),
                        agenda: planningLabel,
                        startDate: dateValue,
                        date: dateValue,
                        endDate: dateValue,
                        fromHour: 0,
                        toHour: 1440,
                        zoneId: kahierZoneId,
                        zoneIds: [],
                        activeParticipantIds: planningUserIds.map((id) => Number(id)),
                        passiveParticipantIds: [],
                        userIds: planningUserIds.map((id) => Number(id)),
                        documents: [],
                        createConversation: false,
                        reminders: [],
                        vehicleIds: [],
                        allDay: true,
                        planningId: Number(selectedPlanningId),
                        planningsId: Number(selectedPlanningId),
                        chauffeurIds: [],
                        visibility: "PUBLIC",
                        visibleToUserIds: [],
                        intermittentVisibility: false,
                        selectedPorteurIds: [],
                        recurrence: {
                            type: "NONE",
                            endDate: null,
                            weekDays: [],
                            monthDays: [],
                        },
                        breaks: [],
                        notifyUsers: true,
                    }),
                });
                if (!planningRes.ok) {
                    const planningData = await planningRes.json().catch(() => null);
                    toast.error(planningData?.error ?? "Événement planning non créé.");
                } else {
                    toast.success("Événement planning créé");
                }
            }
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

    const collaboratorsField = (
        <UserPicker
            label="Collaborateurs concernés (optionnel)"
            options={collaborators}
            selectedIds={collaboratorIds}
            onChange={setCollaboratorIds}
            placeholder="Sélectionner des collaborateurs"
            open={collaboratorsOpen}
            onOpenChange={setCollaboratorsOpen}
            query={collaboratorQuery}
            onQueryChange={setCollaboratorQuery}
            emptyMessage="Aucun collaborateur disponible."
            searchPlaceholder="Rechercher un collaborateur..."
        />
    );

    const filteredUsers = kahierZoneId
        ? kahierUsers.filter((user) => user.zones?.some((zone) => zone.id === kahierZoneId))
        : kahierUsers;
    const kahierUserOptions: PickerOption[] = filteredUsers.map((user) => ({
        id: String(user.id),
        label: `${user.firstname} ${user.lastname}`.trim() || user.email,
        email: user.email,
    }));
    const planningOptions = plannings.map((planning) => ({
        id: String(planning.id),
        label: planning.name,
    }));
    const legendOptions = legends.map((legend) => ({
        id: String(legend.id),
        label: legend.label,
    }));

    return (
        <Card className="border my-1">
            <CardHeader>
                <CardTitle className="text-base">Nouvelle interaction</CardTitle>
                <CardDescription>Log un email, appel, réunion ou note avec ce client.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                    <Accordion
                        type="multiple"
                        value={openSections}
                        onValueChange={(values) => {
                            setOpenSections(values);
                            setCreateTask(values.includes("kahier"));
                        }}
                        className="space-y-3"
                    >
                        <AccordionItem value="interaction" className="overflow-hidden rounded-xl border border-border/90 bg-background px-4">
                            <AccordionTrigger className="py-3 text-foreground hover:no-underline">
                                <div className="text-left">
                                    <p className="text-sm font-semibold">Interaction</p>
                                    <p className="text-xs text-muted-foreground">Type et note</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="grid gap-3 sm:grid-cols-[160px,1fr]">
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
                                            placeholder="Ex : Email de relance"
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            disabled={pending}
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="planning" className="overflow-hidden rounded-xl border border-border/60 bg-background px-4">
                            <AccordionTrigger className="py-3 text-foreground hover:no-underline">
                                <div className="text-left">
                                    <p className="text-sm font-semibold">Planification</p>
                                    <p className="text-xs text-muted-foreground">
                                        {type === "Réunion" ? "Date et horaires" : "Date et heure"}
                                    </p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                {type === "Réunion" ? (
                                    <div className="space-y-3">
                                        <Label>Horaire de réunion</Label>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div className="flex flex-col gap-3">
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
                                            <div className="flex flex-col gap-3">
                                                <Label className="text-xs text-muted-foreground">Début</Label>
                                                <Input
                                                    type="time"
                                                    value={meetingStartTime}
                                                    onChange={(e) => setMeetingStartTime(e.target.value)}
                                                    disabled={pending}
                                                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-3">
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
                                    <div className="space-y-3">
                                        <Label>Quand</Label>
                                        <div className="grid gap-3 sm:grid-cols-[160px,1fr]">
                                            <div className="space-y-3">
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
                                            <div className="space-y-3">
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
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="participants" className="overflow-hidden rounded-xl border border-border/60 bg-background px-4">
                            <AccordionTrigger className="py-3 text-foreground hover:no-underline">
                                <div className="text-left">
                                    <p className="text-sm font-semibold">Participants</p>
                                    <p className="text-xs text-muted-foreground">Collaborateurs concernés</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                {collaboratorsField}
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="kahier" className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 px-4 last:border-b">
                            <AccordionTrigger className="py-3 text-foreground hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-background text-xs font-semibold">
                                        K
                                    </span>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold">Ajouter une tâche Kahier</p>
                                        <p className="text-xs text-muted-foreground">
                                            Catégorie, assignés et création automatique
                                        </p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="space-y-4">
                                    {tabsError && <p className="text-xs text-destructive">{tabsError}</p>}
                                    {tabsLoading && (
                                        <p className="text-xs text-muted-foreground">Chargement des onglets…</p>
                                    )}
                                    {usersError && <p className="text-xs text-destructive">{usersError}</p>}
                                    {usersLoading && (
                                        <p className="text-xs text-muted-foreground">Chargement des utilisateurs…</p>
                                    )}
                                    <div className="space-y-4 rounded-lg bg-background/60 p-3">
                                        <div className="space-y-3">
                                            <Label>Onglet</Label>
                                            <Select
                                                value={selectedTabId}
                                                onValueChange={setSelectedTabId}
                                                disabled={pending || tabsLoading || tabs.length === 0}
                                            >
                                                <SelectTrigger className="w-full">
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
                                        <div className="space-y-3">
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
                                                <SelectTrigger className="w-full">
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
                                        <UserPicker
                                            label="Assigné à"
                                            options={kahierUserOptions}
                                            selectedIds={assignedUserIds}
                                            onChange={setAssignedUserIds}
                                            placeholder="Choisir un utilisateur"
                                            open={assignedOpen}
                                            onOpenChange={setAssignedOpen}
                                            query={assignedQuery}
                                            onQueryChange={setAssignedQuery}
                                            emptyMessage="Aucun utilisateur disponible."
                                            searchPlaceholder="Rechercher un utilisateur..."
                                        />
                                    </div>
                                    <div className="space-y-4 rounded-lg bg-background/60 p-3">
                                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                            <Checkbox
                                                checked={isTaskRecurring}
                                                onCheckedChange={(checked) => setIsTaskRecurring(checked as boolean)}
                                                disabled={pending}
                                                className="cursor-pointer"
                                            />
                                            Tâche récurrente
                                        </label>
                                        {!isTaskRecurring && (
                                            <div className="space-y-2">
                                                <Label>Fin de tâche</Label>
                                                <Popover open={taskEndOpen} onOpenChange={setTaskEndOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="w-full justify-between font-normal">
                                                            {taskEndDate ? format(taskEndDate, "P") : "Choisir une date"}
                                                            <ChevronDown className="h-4 w-4 opacity-60" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <CalendarPicker
                                                            mode="single"
                                                            selected={taskEndDate}
                                                            onSelect={(date) => {
                                                                setTaskEndDate(date);
                                                                setTaskEndOpen(false);
                                                            }}
                                                            captionLayout="dropdown"
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="kahier-planning" className="overflow-hidden rounded-xl border border-border/60 bg-muted/20 px-4 last:border-b">
                            <AccordionTrigger className="py-3 text-foreground hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex size-7 items-center justify-center rounded-full bg-background text-xs font-semibold">
                                        K
                                    </span>
                                    <div className="text-left">
                                        <p className="text-sm font-semibold">Planning Kahier</p>
                                        <p className="text-xs text-muted-foreground">Ajouter l’interaction au planning</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="space-y-3">
                                    {planningsError && <p className="text-xs text-destructive">{planningsError}</p>}
                                    {planningsLoading && (
                                        <p className="text-xs text-muted-foreground">Chargement des plannings…</p>
                                    )}
                                    {usersError && <p className="text-xs text-destructive">{usersError}</p>}
                                    {usersLoading && (
                                        <p className="text-xs text-muted-foreground">Chargement des utilisateurs…</p>
                                    )}
                                    <div className="space-y-3 rounded-lg bg-background/60 p-3">
                                        <div className="space-y-3">
                                            <Label>Titre</Label>
                                            <Input
                                                placeholder="Titre de l'événement"
                                                value={planningTitle}
                                                onChange={(e) => setPlanningTitle(e.target.value)}
                                                disabled={pending}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label>Description</Label>
                                            <Input
                                                placeholder="Description de l'événement"
                                                value={planningDescription}
                                                onChange={(e) => setPlanningDescription(e.target.value)}
                                                disabled={pending}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label>Planning</Label>
                                            <Select
                                                value={selectedPlanningId}
                                                onValueChange={setSelectedPlanningId}
                                                disabled={pending || planningsLoading || plannings.length === 0}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choisir un planning" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {planningOptions.map((planning) => (
                                                        <SelectItem key={planning.id} value={planning.id}>
                                                            {planning.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-3">
                                            <Label>Légende</Label>
                                            <Select
                                                value={selectedLegendId}
                                                onValueChange={setSelectedLegendId}
                                                disabled={
                                                    pending ||
                                                    legendsLoading ||
                                                    !selectedPlanningId ||
                                                    legends.length === 0
                                                }
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Choisir une légende" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {legendOptions.map((legend) => (
                                                        <SelectItem key={legend.id} value={legend.id}>
                                                            {legend.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <UserPicker
                                            label="Assigné à"
                                            options={kahierUserOptions}
                                            selectedIds={planningUserIds}
                                            onChange={setPlanningUserIds}
                                            placeholder="Choisir un utilisateur"
                                            open={planningUsersOpen}
                                            onOpenChange={setPlanningUsersOpen}
                                            query={planningUsersQuery}
                                            onQueryChange={setPlanningUsersQuery}
                                            emptyMessage="Aucun utilisateur disponible."
                                            searchPlaceholder="Rechercher un utilisateur..."
                                        />
                                    </div>
                                    {legendsError && <p className="text-xs text-destructive">{legendsError}</p>}
                                    {legendsLoading && (
                                        <p className="text-xs text-muted-foreground">Chargement des légendes…</p>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
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
