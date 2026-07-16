import type { Request, Response } from "express";
import { prisma, RevenueSource } from "@kahier/db-crm";
import * as service from "../services/clients.service.js";
import * as documentService from "../services/client-documents.service.js";
import { getCurrentUser, getHeaderValue, getParamValue, type CurrentUser } from "../lib/current-user.js";

async function isAssignedToClient(clientId: string, companyId: string, userId: string) {
    const client = await prisma.client.findFirst({
        where: {
            id: clientId,
            companyId,
            OR: [{ ownerId: userId }, { owners: { some: { userId } } }],
        },
        select: { id: true },
    });
    return Boolean(client);
}

async function ensureCanViewClient(clientId: string, currentUser: CurrentUser) {
    if (currentUser.role === "USER") {
        const assigned = await isAssignedToClient(clientId, currentUser.companyId, currentUser.id);
        if (!assigned) return false;
    }
    return true;
}

async function ensureCanEditClient(clientId: string, currentUser: CurrentUser) {
    if (currentUser.role === "ADMIN") return true;
    const assigned = await isAssignedToClient(clientId, currentUser.companyId, currentUser.id);
    return assigned;
}

function normalizeContacts(contacts: unknown) {
    if (!Array.isArray(contacts) || contacts.length === 0) return undefined;
    const cleaned = contacts
        .map((contact) => {
            if (!contact || typeof contact !== "object") return null;
            const c = contact as {
                firstName?: unknown;
                lastName?: unknown;
                email?: unknown;
                phone?: unknown;
                emails?: unknown;
                phones?: unknown;
                role?: unknown;
            };
            const firstName = typeof c.firstName === "string" ? c.firstName.trim() : "";
            const lastName = typeof c.lastName === "string" ? c.lastName.trim() : "";
            const email = typeof c.email === "string" ? c.email.trim() : undefined;
            const phone = typeof c.phone === "string" ? c.phone.trim() : undefined;
            const emails = normalizeStringArray(c.emails ?? c.email);
            const phones = normalizeStringArray(c.phones ?? c.phone);
            const role = typeof c.role === "string" ? c.role.trim() : undefined;
            if (!firstName && !lastName && !email && !phone && emails.length === 0 && phones.length === 0 && !role)
                return null;
            return {
                firstName: firstName || "Contact",
                lastName,
                email: email || emails[0] || null,
                phone: phone || phones[0] || null,
                emails: emails.length ? emails : undefined,
                phones: phones.length ? phones : undefined,
                role: role || null,
            };
        })
        .filter((contact) => contact !== null);

    if (cleaned.length === 0) return undefined;
    return { create: cleaned };
}

function normalizeStringArray(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    }
    return [];
}

function normalizeRevenueSource(value: unknown): RevenueSource | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return Object.values(RevenueSource).includes(trimmed as RevenueSource)
        ? (trimmed as RevenueSource)
        : undefined;
}

export async function list(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const result = await service.list({
        q: (req.query.q as string) ?? "",
        status: (req.query.status as string) ?? undefined,
        segment: (req.query.segment as string) ?? undefined,
        location: (req.query.location as string) ?? undefined,
        page: Number(req.query.page ?? 1),
        pageSize: Number(req.query.pageSize ?? 20),
        companyId: currentUser.companyId,
        ...(currentUser.role === "USER" ? { assignedUserId: currentUser.id } : {}),
    });
    res.json(result);
}

export async function summary(_req: Request, res: Response) {
    const currentUser = await getCurrentUser(_req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    res.json(await service.summary(currentUser.companyId));
}

export async function create(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });

    if (currentUser.subscriptionType === "STARTER_FREE") {
        const clientsCount = await prisma.client.count({ where: { companyId: currentUser.companyId } });
        if (clientsCount >= 200) {
            return res.status(403).json({
                error: "Le plan STARTER_FREE est limité à 200 contacts. Passez à un plan Pro pour en ajouter davantage.",
            });
        }
    }

    const { contacts, ownerIds: _ignoredOwnerIds, ...rest } = req.body ?? {};
    const normalizedContacts = normalizeContacts(contacts);
    const body = (req.body ?? {}) as {
        emails?: unknown;
        phones?: unknown;
        primaryEmail?: unknown;
        primaryPhone?: unknown;
        ownerIds?: unknown;
        revenueSource?: unknown;
    };
    const emails = normalizeStringArray(body.emails);
    const phones = normalizeStringArray(body.phones);
    const ownerIds = Array.isArray(body.ownerIds)
        ? (body.ownerIds as unknown[])
            .filter((id) => typeof id === "string")
            .map((id) => (id as string).trim())
            .filter(Boolean)
        : [];
    const uniqueOwnerIds = Array.from(new Set(ownerIds));
    const normalizedRevenueSource = normalizeRevenueSource(body.revenueSource);
    if ("revenueSource" in body && normalizedRevenueSource === undefined) {
        return res.status(400).json({ error: "Source de revenu invalide" });
    }
    if (currentUser.role !== "ADMIN" && !uniqueOwnerIds.includes(currentUser.id)) {
        uniqueOwnerIds.push(currentUser.id);
    }
    const primaryEmail = typeof body.primaryEmail === "string"
        ? body.primaryEmail?.trim()
        : undefined;
    const primaryPhone = typeof body.primaryPhone === "string"
        ? body.primaryPhone?.trim()
        : undefined;
    const payload = {
        ...rest,
        companyId: currentUser.companyId,
        revenueSource: normalizedRevenueSource ?? null,
        emails: emails.length ? emails : undefined,
        phones: phones.length ? phones : undefined,
        primaryEmail: primaryEmail || emails[0] || null,
        primaryPhone: primaryPhone || phones[0] || null,
        ownerId: uniqueOwnerIds[0] ?? (rest as { ownerId?: string | null }).ownerId ?? null,
        owners: uniqueOwnerIds.length
            ? { create: uniqueOwnerIds.map((id) => ({ userId: id })) }
            : undefined,
    };
    if (normalizedContacts) {
        (payload as typeof payload & { contacts: typeof normalizedContacts }).contacts = normalizedContacts;
    }
    try {
        res.status(201).json(await service.create(payload));
    } catch (error) {
        console.error("createClient", error);
        res.status(500).json({ error: "Impossible de créer le client" });
    }
}

export async function getById(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanViewClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }
    res.json(await service.getById(clientId, currentUser.companyId));
}

export async function update(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanEditClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }
    const body = (req.body ?? {}) as {
        emails?: unknown;
        phones?: unknown;
        primaryEmail?: unknown;
        primaryPhone?: unknown;
        ownerIds?: unknown;
        revenueSource?: unknown;
    };
    const emails = normalizeStringArray(body.emails);
    const phones = normalizeStringArray(body.phones);
    const primaryEmail = typeof body.primaryEmail === "string"
        ? body.primaryEmail?.trim()
        : undefined;
    const primaryPhone = typeof body.primaryPhone === "string"
        ? body.primaryPhone?.trim()
        : undefined;
    const ownerIds = Array.isArray(body.ownerIds)
        ? (body.ownerIds as unknown[])
            .filter((id) => typeof id === "string")
            .map((id) => (id as string).trim())
            .filter(Boolean)
        : [];
    const uniqueOwnerIds = Array.from(new Set(ownerIds));
    const normalizedRevenueSource = normalizeRevenueSource(body.revenueSource);
    if ("revenueSource" in body && normalizedRevenueSource === undefined) {
        return res.status(400).json({ error: "Source de revenu invalide" });
    }
    const rest = { ...(req.body ?? {}) } as Record<string, unknown>;
    delete rest.ownerIds;
    delete rest.revenueSource;
    const payload = {
        ...rest,
        ...("revenueSource" in body
            ? { revenueSource: normalizedRevenueSource ?? null }
            : {}),
        ...("emails" in body ? { emails: emails.length ? emails : [] } : {}),
        ...("phones" in body ? { phones: phones.length ? phones : [] } : {}),
        ...(primaryEmail !== undefined || "emails" in body
            ? { primaryEmail: primaryEmail || emails[0] || null }
            : {}),
        ...(primaryPhone !== undefined || "phones" in body
            ? { primaryPhone: primaryPhone || phones[0] || null }
            : {}),
        ...("ownerIds" in body
            ? {
                ownerId: uniqueOwnerIds[0] ?? null,
                owners: uniqueOwnerIds.length
                    ? {
                        deleteMany: {},
                        create: uniqueOwnerIds.map((id) => ({ userId: id })),
                    }
                    : { deleteMany: {} },
            }
            : {}),
    };
    res.json(await service.update(clientId, currentUser.companyId, payload));
}

export async function remove(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanEditClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }
    await service.remove(clientId, currentUser.companyId);
    res.status(204).send();
}

export async function logInteraction(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanEditClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }

    const type = typeof req.body?.type === "string" ? req.body.type.trim() : "";
    const summary = typeof req.body?.summary === "string" ? req.body.summary.trim() : undefined;
    const occurredAt = req.body?.occurredAt ? new Date(req.body.occurredAt) : undefined;
    const userId = typeof req.body?.userId === "string" ? req.body.userId.trim() : undefined;
    const collaboratorIds = Array.isArray(req.body?.collaboratorIds)
        ? (req.body.collaboratorIds as unknown[])
            .filter((id) => typeof id === "string")
            .map((id) => (id as string).trim())
            .filter(Boolean)
        : undefined;
    const meetingStart = req.body?.meetingStart ? new Date(req.body.meetingStart) : undefined;
    const meetingEnd = req.body?.meetingEnd ? new Date(req.body.meetingEnd) : undefined;

    if (!type || !userId) {
        res.status(400).json({ error: "Type et utilisateur requis" });
        return;
    }
    if (type === "Réunion") {
        if (!meetingStart || !meetingEnd) {
            res.status(400).json({ error: "Heures de début et de fin requises pour une réunion" });
            return;
        }
        if (Number.isNaN(meetingStart.getTime()) || Number.isNaN(meetingEnd.getTime())) {
            res.status(400).json({ error: "Dates de réunion invalides" });
            return;
        }
        if (meetingEnd.getTime() <= meetingStart.getTime()) {
            res.status(400).json({ error: "L'heure de fin doit être après l'heure de début" });
            return;
        }
    }

    try {
        const interaction = await service.addInteraction(clientId, currentUser.companyId, {
            type,
            summary,
            occurredAt,
            userId,
            collaboratorIds,
            meetingStart,
            meetingEnd,
        });
        res.status(201).json({ interaction });
    } catch (error) {
        console.error("logInteraction", error);
        res.status(500).json({ error: "Impossible d'enregistrer l'interaction" });
    }
}

export async function addContact(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanEditClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }

    const firstName = typeof req.body?.firstName === "string" ? req.body.firstName : undefined;
    const lastName = typeof req.body?.lastName === "string" ? req.body.lastName : undefined;
    const email = typeof req.body?.email === "string" ? req.body.email : undefined;
    const phone = typeof req.body?.phone === "string" ? req.body.phone : undefined;
    const emails = normalizeStringArray(req.body?.emails ?? req.body?.email);
    const phones = normalizeStringArray(req.body?.phones ?? req.body?.phone);
    const role = typeof req.body?.role === "string" ? req.body.role : undefined;

    if (!firstName && !lastName && !email && !phone && emails.length === 0 && phones.length === 0 && !role) {
        res.status(400).json({ error: "Au moins une info de contact est requise" });
        return;
    }

    try {
        const contact = await service.addContact(clientId, currentUser.companyId, {
            firstName,
            lastName,
            email: email ?? emails[0] ?? null,
            phone: phone ?? phones[0] ?? null,
            emails: emails.length ? emails : undefined,
            phones: phones.length ? phones : undefined,
            role,
        });
        res.status(201).json({ contact });
    } catch (error) {
        console.error("addContact", error);
        res.status(500).json({ error: "Impossible d'ajouter le contact" });
    }
}

export async function listDocuments(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }

    try {
        if (!(await ensureCanViewClient(clientId, currentUser))) {
            return res.status(403).json({ error: "Accès refusé" });
        }
        const documents = await documentService.list(clientId, currentUser.companyId);
        res.json({ documents });
    } catch (error) {
        console.error("listDocuments", error);
        res.status(500).json({ error: "Impossible de récupérer les documents" });
    }
}

export async function presignDocument(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanEditClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }

    const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
    const contentType = typeof req.body?.contentType === "string" ? req.body.contentType.trim() : "";
    const size = typeof req.body?.size === "number" ? req.body.size : Number(req.body?.size ?? 0);

    if (!fileName) {
        res.status(400).json({ error: "Nom de fichier requis" });
        return;
    }
    if (!Number.isFinite(size) || size <= 0) {
        res.status(400).json({ error: "Taille du fichier invalide" });
        return;
    }
    const maxSize = 25 * 1024 * 1024;
    if (size > maxSize) {
        res.status(400).json({ error: "Fichier trop volumineux (25MB max)" });
        return;
    }

    try {
        const normalizedContentType = contentType || "application/octet-stream";
        const { uploadUrl, key } = await documentService.createUploadUrl(clientId, currentUser.companyId, fileName, normalizedContentType);
        res.json({
            uploadUrl,
            key,
            fileName,
            contentType: normalizedContentType,
        });
    } catch (error) {
        console.error("presignDocument", error);
        res.status(500).json({ error: "Impossible de générer l'URL d'upload" });
    }
}

export async function createDocument(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    if (!clientId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanEditClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }

    const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
    const s3Key = typeof req.body?.key === "string" ? req.body.key.trim() : "";
    const mimeType = typeof req.body?.contentType === "string" ? req.body.contentType.trim() : undefined;
    const size = typeof req.body?.size === "number" ? req.body.size : Number(req.body?.size ?? 0);

    if (!fileName || !s3Key) {
        res.status(400).json({ error: "Nom de fichier et clé S3 requis" });
        return;
    }
    if (!s3Key.includes(`clients/${clientId}/`)) {
        res.status(400).json({ error: "Clé S3 invalide" });
        return;
    }

    try {
        const uploaderId = getHeaderValue(req, "x-user-id")?.trim();
        const document = await documentService.create(clientId, currentUser.companyId, {
            uploaderId,
            fileName,
            s3Key,
            mimeType: mimeType || null,
            size: Number.isFinite(size) && size > 0 ? size : null,
        });
        res.status(201).json({ document });
    } catch (error) {
        console.error("createDocument", error);
        res.status(500).json({ error: "Impossible de créer le document" });
    }
}

export async function getDocumentDownload(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    const documentId = getParamValue(req, "documentId");
    if (!clientId || !documentId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanViewClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }

    try {
        const url = await documentService.createDownloadUrl(documentId, clientId, currentUser.companyId);
        res.json({ url });
    } catch (error) {
        console.error("getDocumentDownload", error);
        res.status(500).json({ error: "Impossible de générer le lien de téléchargement" });
    }
}

export async function updateDocument(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    const documentId = getParamValue(req, "documentId");
    if (!clientId || !documentId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanEditClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }

    const fileName = typeof req.body?.fileName === "string" ? req.body.fileName.trim() : "";
    if (!fileName) {
        res.status(400).json({ error: "Nom de fichier requis" });
        return;
    }

    try {
        const document = await documentService.updateName(documentId, clientId, currentUser.companyId, fileName);
        res.json({ document });
    } catch (error) {
        console.error("updateDocument", error);
        res.status(500).json({ error: "Impossible de renommer le document" });
    }
}

export async function deleteDocument(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const clientId = getParamValue(req, "id");
    const documentId = getParamValue(req, "documentId");
    if (!clientId || !documentId) {
        res.status(400).json({ error: "ID is required" });
        return;
    }
    if (!(await ensureCanEditClient(clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }

    try {
        await documentService.remove(documentId, clientId, currentUser.companyId);
        res.status(204).send();
    } catch (error) {
        console.error("deleteDocument", error);
        res.status(500).json({ error: "Impossible de supprimer le document" });
    }
}

export async function updateInteraction(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const interactionId = getParamValue(req, "interactionId");
    if (!interactionId) {
        res.status(400).json({ error: "interactionId is required" });
        return;
    }
    const interaction = await prisma.clientInteraction.findUnique({
        where: { id: interactionId },
        select: { clientId: true },
    });
    if (!interaction || !(await ensureCanEditClient(interaction.clientId, currentUser))) {
        return res.status(403).json({ error: "Accès refusé" });
    }

    const type = typeof req.body?.type === "string" ? req.body.type.trim() : undefined;
    const summary = typeof req.body?.summary === "string" ? req.body.summary.trim() : undefined;
    const occurredAt = req.body?.occurredAt ? new Date(req.body.occurredAt) : undefined;
    const userId = typeof req.body?.userId === "string" ? req.body.userId.trim() : undefined;
    const collaboratorIds = Array.isArray(req.body?.collaboratorIds)
        ? (req.body.collaboratorIds as unknown[])
            .filter((id) => typeof id === "string")
            .map((id) => (id as string).trim())
            .filter(Boolean)
        : undefined;
    const meetingStart = req.body?.meetingStart ? new Date(req.body.meetingStart) : undefined;
    const meetingEnd = req.body?.meetingEnd ? new Date(req.body.meetingEnd) : undefined;

    if (
        !type &&
        !summary &&
        !occurredAt &&
        userId === undefined &&
        collaboratorIds === undefined &&
        meetingStart === undefined &&
        meetingEnd === undefined
    ) {
        res.status(400).json({ error: "Aucune donnée à mettre à jour" });
        return;
    }

    try {
        const interaction = await service.updateInteraction(interactionId, currentUser.companyId, {
            type,
            summary,
            occurredAt,
            userId,
            collaboratorIds,
            meetingStart,
            meetingEnd,
        });
        res.json({ interaction });
    } catch (error) {
        console.error("updateInteraction", error);
        res.status(500).json({ error: "Impossible de mettre à jour l'interaction" });
    }
}

export async function deleteInteraction(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const interactionId = getParamValue(req, "interactionId");
    if (!interactionId) {
        res.status(400).json({ error: "interactionId is required" });
        return;
    }

    try {
        const interaction = await prisma.clientInteraction.findUnique({
            where: { id: interactionId },
            select: { clientId: true },
        });
        if (!interaction || !(await ensureCanEditClient(interaction.clientId, currentUser))) {
            return res.status(403).json({ error: "Accès refusé" });
        }
        await service.deleteInteraction(interactionId, currentUser.companyId);
        res.status(204).send();
    } catch (error) {
        console.error("deleteInteraction", error);
        res.status(500).json({ error: "Impossible de supprimer l'interaction" });
    }
}

export async function deleteContact(req: Request, res: Response) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return res.status(401).json({ error: "Utilisateur ou entreprise introuvable" });
    const contactId = getParamValue(req, "contactId");
    if (!contactId) {
        res.status(400).json({ error: "contactId is required" });
        return;
    }

    try {
        const contact = await prisma.clientContact.findUnique({
            where: { id: contactId },
            select: { clientId: true },
        });
        if (!contact || !(await ensureCanEditClient(contact.clientId, currentUser))) {
            return res.status(403).json({ error: "Accès refusé" });
        }
        await service.deleteContact(contactId, currentUser.companyId);
        res.status(204).send();
    } catch (error) {
        console.error("deleteContact", error);
        res.status(500).json({ error: "Impossible de supprimer le contact" });
    }
}
