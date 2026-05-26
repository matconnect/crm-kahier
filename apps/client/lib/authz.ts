import { auth } from "@/lib/session";
import { getServerApiBase } from "@/lib/api-base";
import { hasBillingFeature, type BillingFeature } from "@/lib/subscription";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/roles";

export async function requireAuth() {
    const session = await auth();
    if (!session) redirect("/login");
    return session;
}

export async function requireRole(...roles: Role[]) {
    const session = await requireAuth();
    const role = session.user?.role;

    if (!role || !roles.includes(role)) {
        redirect("/dashboard");
    }

    return session;
}

export async function requireBillingFeature(feature: BillingFeature, fallbackPath = "/dashboard/settings?upgrade=1") {
    const session = await requireAuth();
    const userId = session.user?.id ?? "";
    const apiBase = getServerApiBase();
    if (!userId || !apiBase) redirect(fallbackPath);

    try {
        const response = await fetch(`${apiBase}/profile/subscription`, {
            cache: "no-store",
            headers: { "x-user-id": userId },
        });
        if (!response.ok) redirect(fallbackPath);

        const data = (await response.json()) as {
            company?: { subscriptionType?: string | null };
        };
        const subscriptionType = data.company?.subscriptionType ?? null;
        if (!hasBillingFeature(subscriptionType, feature)) {
            redirect(fallbackPath);
        }
    } catch {
        redirect(fallbackPath);
    }

    return session;
}
