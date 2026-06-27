"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { getBrowserApiBase } from "@/lib/public-api-base";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProjectTask = {
    id: number;
    name: string;
    completed: boolean;
    priority: number | null;
    isRecurring: boolean;
    displayOrder: number;
    updatedAt: string;
    categoryId: number;
    assignedUsers: {
        id: number;
        firstname: string;
        lastname: string;
    }[];
};

type Props = {
    projectId: string;
    currentUserId: string;
    kahierCategoryId: number | null;
    kahierTabId: number | null;
    initialProgress: number;
    initialTaskCompletionState: Record<string, boolean> | null;
    canEdit?: boolean;
};

function computeTaskProgress(tasks: ProjectTask[], completionState: Record<string, boolean>) {
    if (!tasks.length) return 0;
    const completedCount = tasks.filter((task) => {
        const override = completionState[String(task.id)];
        return typeof override === "boolean" ? override : task.completed;
    }).length;
    return Math.round((completedCount / tasks.length) * 100);
}

function compactCompletionState(tasks: ProjectTask[], completionState: Record<string, boolean>) {
    return Object.fromEntries(
        Object.entries(completionState).filter(([taskId, checked]) => {
            const task = tasks.find((entry) => String(entry.id) === taskId);
            if (!task) return false;
            return checked !== task.completed;
        }),
    );
}

function formatAssignees(task: ProjectTask) {
    if (!task.assignedUsers.length) return "Non assignée";
    return task.assignedUsers
        .map((user) => `${user.firstname} ${user.lastname}`.trim())
        .filter(Boolean)
        .join(", ");
}

async function resolveKahierApiKey(apiBase: string, currentUserId: string) {
    const localKey = typeof window !== "undefined" ? window.localStorage.getItem("kahier_api_key")?.trim() : "";
    if (localKey) {
        return localKey;
    }

    const keyRes = await fetch(`${apiBase}/kahier-link`, {
        cache: "no-store",
        headers: { "x-user-id": currentUserId },
    });
    const keyData = (await keyRes.json().catch(() => null)) as
        | { connection?: { kahierApiKey?: string | null } | null; error?: string }
        | null;

    if (!keyRes.ok) {
        throw new Error(keyData?.error ?? "Impossible de récupérer la clé API Kahier.");
    }

    const resolvedApiKey = keyData?.connection?.kahierApiKey?.trim() ?? "";
    if (!resolvedApiKey) {
        throw new Error("Clé API Kahier absente pour cet établissement.");
    }

    if (typeof window !== "undefined") {
        window.localStorage.setItem("kahier_api_key", resolvedApiKey);
    }

    return resolvedApiKey;
}

async function fetchProjectTasks(apiBase: string, currentUserId: string, kahierCategoryId: number, kahierTabId: number) {
    const resolvedApiKey = await resolveKahierApiKey(apiBase, currentUserId);
    const response = await fetch(`${apiBase}/kahier/categories/${kahierCategoryId}/tasks?periodeTabId=${kahierTabId}`, {
        cache: "no-store",
        headers: { "x-api-key": resolvedApiKey },
    });
    const data = (await response.json().catch(() => null)) as ProjectTask[] | { error?: string } | null;
    if (!response.ok || !Array.isArray(data)) {
        throw new Error(
            !Array.isArray(data) && data?.error
                ? data.error
                : "Impossible de récupérer les tâches Kahier.",
        );
    }

    return data;
}

export function ProjectTaskProgress({
    projectId,
    currentUserId,
    kahierCategoryId,
    kahierTabId,
    initialProgress,
    initialTaskCompletionState,
    canEdit = false,
}: Props) {
    const router = useRouter();
    const apiBase = getBrowserApiBase();
    const [tasks, setTasks] = React.useState<ProjectTask[]>([]);
    const [completionState, setCompletionState] = React.useState<Record<string, boolean>>(initialTaskCompletionState ?? {});
    const [progress, setProgress] = React.useState(initialProgress);
    const [loading, setLoading] = React.useState(Boolean(kahierCategoryId && kahierTabId));
    const [savingTaskId, setSavingTaskId] = React.useState<number | null>(null);
    const [creatingTask, setCreatingTask] = React.useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
    const [newTaskName, setNewTaskName] = React.useState("");
    const [newTaskRecurring, setNewTaskRecurring] = React.useState(false);
    const [isRefreshing, startRefresh] = React.useTransition();
    const initialSyncDoneRef = React.useRef(false);

    async function persistProjectProgress(nextTasks: ProjectTask[], nextCompletionState: Record<string, boolean>) {
        if (!apiBase) {
            throw new Error("Configuration API manquante.");
        }

        const sanitizedState = compactCompletionState(nextTasks, nextCompletionState);
        const nextProgress = computeTaskProgress(nextTasks, sanitizedState);

        const response = await fetch(`${apiBase}/projects/${projectId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-user-id": currentUserId,
            },
            body: JSON.stringify({
                progress: nextProgress,
                kahierTaskCompletionState: Object.keys(sanitizedState).length ? sanitizedState : null,
            }),
        });

        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
            throw new Error(data?.error ?? "Impossible de mettre à jour l'avancement.");
        }

        setCompletionState(sanitizedState);
        setProgress(nextProgress);
        return { sanitizedState, nextProgress };
    }

    React.useEffect(() => {
        setCompletionState(initialTaskCompletionState ?? {});
    }, [initialTaskCompletionState]);

    React.useEffect(() => {
        setProgress(computeTaskProgress(tasks, completionState));
    }, [completionState, tasks]);

    React.useEffect(() => {
        if (!kahierCategoryId || !kahierTabId || !apiBase) {
            setLoading(false);
            setTasks([]);
            setProgress(0);
            return;
        }
        const resolvedApiBase = apiBase;
        const categoryId = kahierCategoryId;
        const tabId = kahierTabId;

        let active = true;

        async function loadTasks() {
            setLoading(true);
            try {
                if (!currentUserId) {
                    throw new Error("Utilisateur Kahier introuvable.");
                }

                const data = await fetchProjectTasks(resolvedApiBase, currentUserId, categoryId, tabId);

                if (!active) return;
                setTasks(data);
            } catch (error) {
                if (!active) return;
                toast.error(error instanceof Error ? error.message : "Impossible de récupérer les tâches Kahier.");
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        void loadTasks();
        return () => {
            active = false;
        };
    }, [apiBase, currentUserId, kahierCategoryId, kahierTabId]);

    React.useEffect(() => {
        if (loading || !tasks.length || initialSyncDoneRef.current || !apiBase) return;

        const nextProgress = computeTaskProgress(tasks, completionState);
        if (nextProgress === initialProgress) {
            initialSyncDoneRef.current = true;
            return;
        }

        initialSyncDoneRef.current = true;
        void (async () => {
            const sanitizedState = compactCompletionState(tasks, completionState);
            await fetch(`${apiBase}/projects/${projectId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": currentUserId,
                },
                body: JSON.stringify({
                    progress: nextProgress,
                    kahierTaskCompletionState: Object.keys(sanitizedState).length ? sanitizedState : null,
                }),
            }).catch(() => null);
            startRefresh(() => router.refresh());
        })();
    }, [apiBase, completionState, currentUserId, initialProgress, loading, projectId, router, tasks]);

    async function toggleTask(task: ProjectTask, checked: boolean) {
        if (!apiBase || !kahierTabId) {
            toast.error("Configuration API manquante.");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur Kahier introuvable.");
            return;
        }

        const previousTasks = tasks;
        const previousCompletionState = completionState;
        const previousProgress = progress;
        const currentOverride = completionState[String(task.id)];
        const currentChecked = typeof currentOverride === "boolean" ? currentOverride : task.completed;

        if (currentChecked === checked) {
            return;
        }

        const optimisticTasks = tasks.map((entry) => (entry.id === task.id ? { ...entry, completed: checked } : entry));
        const nextState = { ...completionState };
        delete nextState[String(task.id)];
        const sanitizedState = compactCompletionState(optimisticTasks, nextState);
        const nextProgress = computeTaskProgress(optimisticTasks, sanitizedState);

        setSavingTaskId(task.id);
        setTasks(optimisticTasks);
        setCompletionState(sanitizedState);
        setProgress(nextProgress);

        try {
            const resolvedApiKey = await resolveKahierApiKey(apiBase, currentUserId);
            const kahierResponse = await fetch(`${apiBase}/kahier/tasks/${task.id}/completion`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": resolvedApiKey,
                },
                body: JSON.stringify({
                    categoryId: task.categoryId,
                    periodeTabId: kahierTabId,
                    completed: checked,
                }),
            });

            const kahierData = (await kahierResponse.json().catch(() => null)) as (ProjectTask & { error?: string }) | null;
            if (!kahierResponse.ok) {
                throw new Error(kahierData?.error ?? "Impossible de mettre à jour la tâche dans Kahier.");
            }
            if (!kahierData || typeof kahierData.id !== "number") {
                throw new Error("Réponse Kahier invalide.");
            }

            const syncedTasks = optimisticTasks.map((entry) => (entry.id === task.id ? { ...entry, ...kahierData } : entry));
            setTasks(syncedTasks);
            await persistProjectProgress(syncedTasks, nextState);

            startRefresh(() => router.refresh());
        } catch (error) {
            setTasks(previousTasks);
            setCompletionState(previousCompletionState);
            setProgress(previousProgress);
            toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour l'avancement.");
        } finally {
            setSavingTaskId(null);
        }
    }

    async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canEdit) {
            toast.error("Vous ne pouvez pas créer de tâche sur ce projet.");
            return;
        }
        if (!apiBase || !kahierTabId || !kahierCategoryId) {
            toast.error("Catégorie Kahier non configurée.");
            return;
        }
        if (!currentUserId) {
            toast.error("Utilisateur Kahier introuvable.");
            return;
        }
        if (!newTaskName.trim()) {
            toast.error("Le nom de la tâche est requis.");
            return;
        }

        setCreatingTask(true);
        try {
            const resolvedApiKey = await resolveKahierApiKey(apiBase, currentUserId);
            const taskResponse = await fetch(`${apiBase}/kahier/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": resolvedApiKey,
                },
                body: JSON.stringify({
                    name: newTaskName.trim(),
                    categoryId: kahierCategoryId,
                    assignedUserIds: [],
                    daysOfWeek: [],
                    displayOrder: 0,
                    positionAfterId: "",
                    isRecurring: newTaskRecurring,
                    endDate: null,
                    reminder_1: null,
                    reminder_2: null,
                    reminder_3: null,
                    priority: null,
                }),
            });

            const taskData = (await taskResponse.json().catch(() => null)) as { error?: string } | null;
            if (!taskResponse.ok) {
                throw new Error(taskData?.error ?? "Impossible de créer la tâche Kahier.");
            }

            const refreshedTasks = await fetchProjectTasks(apiBase, currentUserId, kahierCategoryId, kahierTabId);
            setTasks(refreshedTasks);
            await persistProjectProgress(refreshedTasks, completionState);

            setNewTaskName("");
            setNewTaskRecurring(false);
            setIsCreateDialogOpen(false);
            toast.success("Tâche Kahier créée.");
            startRefresh(() => router.refresh());
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible de créer la tâche Kahier.");
        } finally {
            setCreatingTask(false);
        }
    }

    if (!kahierCategoryId || !kahierTabId) {
        return null;
    }

    const completedCount = tasks.filter((task) => {
        const override = completionState[String(task.id)];
        return typeof override === "boolean" ? override : task.completed;
    }).length;

    return (
        <div className="grid gap-6">
            <Card className="rounded-[2rem] border border-slate-200 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl transition">
                <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <CardTitle className="text-xl text-slate-950">Avancement et tâches</CardTitle>
                        {canEdit ? (
                            <div className="text-sm text-slate-500">
                                Crée une tâche directement dans la catégorie Kahier liée au projet.
                            </div>
                        ) : null}
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
                        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
                            <p className="text-xs uppercase text-slate-400">Avancement</p>
                            <p className="mt-2 text-4xl font-semibold text-slate-950">{progress}%</p>
                            <p className="mt-2 text-sm text-slate-600">
                                {completedCount} tâche{completedCount > 1 ? "s" : ""} cochée{completedCount > 1 ? "s" : ""} sur {tasks.length}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {canEdit ? (
                                <div className="flex justify-end">
                                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Créer une tâche
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Nouvelle tâche Kahier</DialogTitle>
                                                <DialogDescription>
                                                    Cette tâche sera créée dans la catégorie liée à ce projet.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={(event) => void handleCreateTask(event)} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="project-new-task-name">Nom de la tâche</Label>
                                                    <Input
                                                        id="project-new-task-name"
                                                        value={newTaskName}
                                                        onChange={(event) => setNewTaskName(event.target.value)}
                                                        placeholder="Ex. Préparer le point client"
                                                        disabled={creatingTask}
                                                    />
                                                </div>
                                                <label className="flex items-center gap-3 text-sm text-slate-600">
                                                    <Checkbox
                                                        checked={newTaskRecurring}
                                                        onCheckedChange={(value) => setNewTaskRecurring(value === true)}
                                                        disabled={creatingTask}
                                                    />
                                                    Tâche récurrente
                                                </label>
                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setIsCreateDialogOpen(false)}
                                                        disabled={creatingTask}
                                                    >
                                                        Annuler
                                                    </Button>
                                                    <Button type="submit" disabled={creatingTask || !newTaskName.trim()}>
                                                        {creatingTask ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                                        Créer la tâche
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            ) : null}
                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-slate-950 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-slate-600">
                                Les cases ci-dessous pilotent l&apos;avancement du projet à partir du nombre de tâches liées.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                            Chargement des tâches Kahier…
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
                            Aucune tâche Kahier n&apos;est encore liée à cette catégorie.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tasks.map((task) => {
                                const override = completionState[String(task.id)];
                                const checked = typeof override === "boolean" ? override : task.completed;
                                const isSaving = savingTaskId === task.id;

                                return (
                                    <label
                                        key={task.id}
                                        className="flex cursor-pointer items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={(value) => void toggleTask(task, Boolean(value))}
                                            disabled={isSaving}
                                            className="mt-0.5"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-3">
                                                <p className={`text-sm font-medium ${checked ? "text-slate-400 line-through" : "text-slate-950"}`}>
                                                    {task.name}
                                                </p>
                                                {checked ? <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-500" /> : null}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                <span>Assigné : {formatAssignees(task)}</span>
                                                <span>Priorité : {task.priority ?? "Non renseignée"}</span>
                                                <span>{task.isRecurring ? "Récurrente" : "Ponctuelle"}</span>
                                                {isSaving || isRefreshing ? <span>Sauvegarde…</span> : null}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
