import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { Role } from "@/lib/roles";

export const SESSION_COOKIE_NAME = "crm_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SESSION_VERSION = 1;

export type SessionUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    companyId: string | null;
};

type SessionTokenPayload = {
    v: number;
    exp: number;
    iat: number;
    user: SessionUser;
};

export type SessionData = {
    user: SessionUser;
    exp: number;
    iat: number;
};

function getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
    if (secret && secret.trim().length >= 16) return secret;
    if (process.env.NODE_ENV !== "production") return "dev-insecure-session-secret-change-me";
    throw new Error("SESSION_SECRET (ou AUTH_SECRET/NEXTAUTH_SECRET) est requis en production.");
}

function encodeBase64Url(input: Uint8Array): string {
    if (typeof Buffer !== "undefined") {
        return Buffer.from(input)
            .toString("base64")
            .replaceAll("+", "-")
            .replaceAll("/", "_")
            .replaceAll(/=+$/g, "");
    }
    let binary = "";
    for (const byte of input) binary += String.fromCharCode(byte);
    // eslint-disable-next-line no-undef
    return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll(/=+$/g, "");
}

function decodeBase64Url(input: string): Uint8Array | null {
    const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const base64 = normalized + padding;
    try {
        if (typeof Buffer !== "undefined") {
            return new Uint8Array(Buffer.from(base64, "base64"));
        }
        // eslint-disable-next-line no-undef
        const binary = atob(base64);
        const output = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) output[i] = binary.charCodeAt(i);
        return output;
    } catch {
        return null;
    }
}

let hmacKeyPromise: Promise<CryptoKey> | null = null;

async function getHmacKey(): Promise<CryptoKey> {
    if (!hmacKeyPromise) {
        hmacKeyPromise = crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(getSessionSecret()),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign", "verify"],
        );
    }
    return hmacKeyPromise;
}

async function signPayload(payload: string): Promise<string> {
    const key = await getHmacKey();
    const raw = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return encodeBase64Url(new Uint8Array(raw));
}

function isSessionUser(value: unknown): value is SessionUser {
    if (!value || typeof value !== "object") return false;
    const user = value as Record<string, unknown>;
    return (
        typeof user.id === "string" &&
        typeof user.email === "string" &&
        typeof user.firstName === "string" &&
        typeof user.lastName === "string" &&
        typeof user.role === "string" &&
        (typeof user.companyId === "string" || user.companyId === null)
    );
}

export function getSessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: "lax" as const,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    };
}

export async function createSessionToken(user: SessionUser): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload: SessionTokenPayload = {
        v: SESSION_VERSION,
        iat: now,
        exp: now + SESSION_MAX_AGE_SECONDS,
        user,
    };
    const payloadSegment = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
    const signatureSegment = await signPayload(payloadSegment);
    return `${payloadSegment}.${signatureSegment}`;
}

export async function readSessionToken(token: string | null | undefined): Promise<SessionData | null> {
    if (!token) return null;
    const [payloadSegment, signatureSegment] = token.split(".");
    if (!payloadSegment || !signatureSegment) return null;

    const expectedSignature = await signPayload(payloadSegment);
    if (signatureSegment !== expectedSignature) return null;

    const rawPayload = decodeBase64Url(payloadSegment);
    if (!rawPayload) return null;

    try {
        const parsed = JSON.parse(new TextDecoder().decode(rawPayload)) as Partial<SessionTokenPayload>;
        if (parsed.v !== SESSION_VERSION) return null;
        if (typeof parsed.exp !== "number" || typeof parsed.iat !== "number") return null;
        if (!isSessionUser(parsed.user)) return null;
        if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;

        return {
            user: parsed.user,
            exp: parsed.exp,
            iat: parsed.iat,
        };
    } catch {
        return null;
    }
}

export async function auth(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return readSessionToken(token);
}

export async function authFromRequest(request: NextRequest): Promise<SessionData | null> {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    return readSessionToken(token);
}
