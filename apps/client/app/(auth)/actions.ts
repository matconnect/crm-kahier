"use server";

import { cookies } from "next/headers";
import { getServerApiBase } from "@/lib/api-base";
import {
    createSessionToken,
    getSessionCookieOptions,
    SESSION_COOKIE_NAME,
    type SessionUser,
} from "@/lib/session";

type ActionResult = {
    ok: boolean;
    error?: string;
};

type RegisterPayload = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyCode?: string;
    companyName?: string;
};

type RegisterWithPlanPayload = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName: string;
    planId: "starter" | "pro" | "enterprise";
    billingCycle: "monthly" | "yearly";
    returnBaseUrl?: string;
};

type RegisterWithPlanResult = ActionResult & {
    checkoutUrl?: string;
};

function extractErrorMessage(raw: unknown): string | null {
    if (!raw || typeof raw !== "object") return null;
    const data = raw as Record<string, unknown>;
    if (typeof data.error === "string" && data.error.trim()) return data.error;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
    return null;
}

export async function loginAction(payload: { email: string; password: string }): Promise<ActionResult> {
    const apiBase = getServerApiBase();
    if (!apiBase) {
        return { ok: false, error: "API backend non configurée." };
    }

    const email = payload.email.trim().toLowerCase();
    const password = payload.password;
    if (!email || !password) {
        return { ok: false, error: "Email et mot de passe requis." };
    }

    const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
    });

    const data = (await res.json().catch(() => null)) as { user?: SessionUser; error?: string; message?: string } | null;
    if (!res.ok || !data?.user?.id) {
        const backendError = extractErrorMessage(data);
        return {
            ok: false,
            error: backendError ?? `Login backend échoué (HTTP ${res.status}).`,
        };
    }

    const token = await createSessionToken(data.user);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return { ok: true };
}

export async function registerAction(payload: RegisterPayload): Promise<ActionResult> {
    const apiBase = getServerApiBase();
    if (!apiBase) {
        return { ok: false, error: "API backend non configurée." };
    }

    const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
    });

    const data = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (!res.ok) {
        const backendError = extractErrorMessage(data);
        return {
            ok: false,
            error: backendError ?? `Register backend échoué (HTTP ${res.status}).`,
        };
    }

    return { ok: true };
}

export async function registerWithPlanAction(payload: RegisterWithPlanPayload): Promise<RegisterWithPlanResult> {
    const apiBase = getServerApiBase();
    if (!apiBase) {
        return { ok: false, error: "API backend non configurée." };
    }

    const res = await fetch(`${apiBase}/billing/register-with-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
    });

    const data = (await res.json().catch(() => null)) as
        | { error?: string; message?: string; checkoutUrl?: string }
        | null;
    if (!res.ok) {
        const backendError = extractErrorMessage(data);
        return {
            ok: false,
            error: backendError ?? `Register + Stripe backend échoué (HTTP ${res.status}).`,
        };
    }

    if (!data?.checkoutUrl) {
        return { ok: false, error: "Lien de paiement Stripe introuvable." };
    }

    return { ok: true, checkoutUrl: data.checkoutUrl };
}

export async function logoutAction(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });
}
