import { auth } from "@/auth";
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
