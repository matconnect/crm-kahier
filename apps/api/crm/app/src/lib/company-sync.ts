import { prisma } from "@kahier/db-crm";
import { readFileSync } from "node:fs";

type CompanyContextUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "USER" | "MANAGER" | "ADMIN";
    companyId: string;
};

type CompanyContext = {
    user: CompanyContextUser;
    company: {
        id: string;
        name: string;
        code: string;
        legalForm?: string | null;
        capitalSocialCents?: number | null;
        siren?: string | null;
        siret?: string | null;
        vatNumber?: string | null;
        rcsCity?: string | null;
        addressLine1?: string | null;
        addressLine2?: string | null;
        postalCode?: string | null;
        city?: string | null;
        country?: string | null;
        contactEmail?: string | null;
        contactPhone?: string | null;
        paymentTerms?: string | null;
        latePenaltyRateBps?: number | null;
        fixedCompensationCents?: number | null;
        subscriptionType?: string | null;
    };
};

type CompanyUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "USER" | "MANAGER" | "ADMIN";
    companyId: string;
};

function fromEnvOrFile(name: string): string | undefined {
    const direct = process.env[name];
    if (direct && direct.trim()) return direct.trim();

    const filePath = process.env[`${name}_FILE`];
    if (filePath && filePath.trim()) {
        return readFileSync(filePath.trim(), "utf8").trim();
    }

    return undefined;
}

function requireEnvOrFile(name: string): string {
    const value = fromEnvOrFile(name);
    if (!value) {
        throw new Error(`Missing required environment variable: ${name} or ${name}_FILE`);
    }
    return value;
}

async function fetchFromCompanyService<T>(path: string): Promise<T> {
    const baseUrl = requireEnvOrFile("COMPANY_SERVICE_URL").replace(/\/$/, "");
    const internalToken = requireEnvOrFile("INTERNAL_SERVICE_TOKEN");

    const res = await fetch(`${baseUrl}${path}`, {
        headers: { "x-internal-token": internalToken },
    });

    if (!res.ok) {
        throw new Error(`Company service request failed (${res.status}) on ${path}`);
    }

    return (await res.json()) as T;
}

export async function fetchCompanyContext(userId: string): Promise<CompanyContext> {
    return fetchFromCompanyService<CompanyContext>(`/internal/context/${encodeURIComponent(userId)}`);
}

export async function fetchCompanyUsers(companyId: string): Promise<CompanyUser[]> {
    const data = await fetchFromCompanyService<{ users: CompanyUser[] }>(
        `/internal/company/${encodeURIComponent(companyId)}/users`,
    );
    return data.users;
}

export async function syncCompanySnapshot(context: CompanyContext, users: CompanyUser[]): Promise<void> {
    await prisma.company.upsert({
        where: { id: context.company.id },
        create: {
            id: context.company.id,
            name: context.company.name,
            code: context.company.code,
            legalForm: context.company.legalForm ?? null,
            capitalSocialCents: context.company.capitalSocialCents ?? null,
            siren: context.company.siren ?? null,
            siret: context.company.siret ?? null,
            vatNumber: context.company.vatNumber ?? null,
            rcsCity: context.company.rcsCity ?? null,
            addressLine1: context.company.addressLine1 ?? null,
            addressLine2: context.company.addressLine2 ?? null,
            postalCode: context.company.postalCode ?? null,
            city: context.company.city ?? null,
            country: context.company.country ?? null,
            contactEmail: context.company.contactEmail ?? null,
            contactPhone: context.company.contactPhone ?? null,
            paymentTerms: context.company.paymentTerms ?? null,
            latePenaltyRateBps: context.company.latePenaltyRateBps ?? null,
            fixedCompensationCents: context.company.fixedCompensationCents ?? 4000,
            subscriptionType: context.company.subscriptionType ?? "STARTER_FREE",
        },
        update: {
            name: context.company.name,
            code: context.company.code,
            legalForm: context.company.legalForm ?? null,
            capitalSocialCents: context.company.capitalSocialCents ?? null,
            siren: context.company.siren ?? null,
            siret: context.company.siret ?? null,
            vatNumber: context.company.vatNumber ?? null,
            rcsCity: context.company.rcsCity ?? null,
            addressLine1: context.company.addressLine1 ?? null,
            addressLine2: context.company.addressLine2 ?? null,
            postalCode: context.company.postalCode ?? null,
            city: context.company.city ?? null,
            country: context.company.country ?? null,
            contactEmail: context.company.contactEmail ?? null,
            contactPhone: context.company.contactPhone ?? null,
            paymentTerms: context.company.paymentTerms ?? null,
            latePenaltyRateBps: context.company.latePenaltyRateBps ?? null,
            fixedCompensationCents: context.company.fixedCompensationCents ?? 4000,
            subscriptionType: context.company.subscriptionType ?? "STARTER_FREE",
        },
    });

    await prisma.$transaction(
        users.map((user) =>
            prisma.user.upsert({
                where: { id: user.id },
                create: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    companyId: user.companyId,
                    password: "__INTERNAL_SYNC__",
                },
                update: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    companyId: user.companyId,
                },
            }),
        ),
    );
}
