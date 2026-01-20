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
    displayOrder: number;
    periodeTabId: number;
    createdAt: string;
    updatedAt: string;
    color?: string | null;
};

export type KahierTaskPayload = {
    name: string;
    categoryId: number;
    assignedUserIds: number[];
    daysOfWeek: string[];
    displayOrder: number;
    positionAfterId: string;
    isRecurring: boolean;
    reminder_1: string | null;
    reminder_2: string | null;
    reminder_3: string | null;
    priority: string | null;
};
