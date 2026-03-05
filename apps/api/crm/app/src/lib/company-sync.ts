import { prisma } from "@kahier/db-crm";

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

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

async function fetchFromCompanyService<T>(path: string): Promise<T> {
    const baseUrl = requireEnv("COMPANY_SERVICE_URL").replace(/\/$/, "");
    const internalToken = requireEnv("INTERNAL_SERVICE_TOKEN");

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
        },
        update: {
            name: context.company.name,
            code: context.company.code,
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
