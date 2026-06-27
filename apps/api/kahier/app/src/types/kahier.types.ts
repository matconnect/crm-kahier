export type KahierPeriodeTab = {
    id: number;
    name: string;
    label: string;
    zoneId: number;
    establishmentId: number;
    createdAt: string;
    updatedAt: string;
    isGeneral: boolean;
    planningId: number | null;
};

export type KahierCategory = {
    id: number;
    name: string;
    caseNumber?: string | null;
    clientName?: string | null;
    departureCode?: string | null;
    arrivalCode?: string | null;
    recurrenceDate?: string | null;
    deadlineDate?: string | null;
    displayOrder: number;
    periodeTabId: number;
    crmProjectId?: string | null;
    crmProjectName?: string | null;
    createdAt: string;
    updatedAt: string;
    color?: string | null;
    assignedUsers?: { id: number }[];
    Task?: KahierTask[];
};

export type KahierTask = {
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

export type KahierTaskPayload = {
    name: string;
    categoryId: number;
    assignedUserIds: number[];
    daysOfWeek: string[];
    displayOrder: number;
    positionAfterId: string;
    isRecurring: boolean;
    endDate: string | null;
    reminder_1: string | null;
    reminder_2: string | null;
    reminder_3: string | null;
    priority: string | null;
};

export type KahierUser = {
    id: number;
    firstname: string;
    lastname: string;
    role: string;
    email: string;
    avatar: string | null;
    color: string | null;
    zones: { id: number; name: string }[];
};

export type KahierPlanning = {
    id: number;
    name: string;
    type: string;
    color: string | null;
    establishmentId: number;
};

export type KahierLegend = {
    id: number;
    label: string;
    color: string;
    planningId: number | null;
};

export type KahierCreateLegendPayload = {
    label: string;
    color: string;
    selectedPlanningId: number;
    agenda_principal?: boolean;
};

export type KahierCreateTabPayload = {
    name: string;
    zoneId: number;
};

export type KahierCreateCategoryPayload = {
    name: string;
    tabId: number;
};

export type KahierUpdateCategoryPayload = {
    periodeTabId: number;
    crmProjectId: string | null;
    crmProjectName: string | null;
};

export type KahierSetTaskCompletionPayload = {
    categoryId: number;
    periodeTabId: number;
    completed: boolean;
};
