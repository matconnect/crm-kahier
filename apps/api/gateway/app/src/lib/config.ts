import { readFileSync } from "node:fs";

export const readSecret = (path: string): string => readFileSync(path, "utf8").trim();

export const fromEnvOrFile = (name: string): string | undefined => {
    const direct = process.env[name];
    if (direct && direct.trim()) return direct.trim();

    const filePath = process.env[`${name}_FILE`];
    if (filePath && filePath.trim()) return readSecret(filePath.trim());

    return undefined;
};

export const requireEnvOrFile = (name: string): string => {
    const value = fromEnvOrFile(name);
    if (!value) throw new Error(`Missing required env: ${name} or ${name}_FILE`);
    return value;
};

export const requireHttpUrl = (name: string): string => {
    const value = requireEnvOrFile(name);
    let parsed: URL;
    try {
        parsed = new URL(value);
    } catch {
        throw new Error(`Invalid URL for ${name}: "${value}"`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error(`Invalid URL protocol for ${name}: "${parsed.protocol}"`);
    }
    return parsed.toString().replace(/\/$/, "");
};

export const splitUrls = (csv?: string) =>
    (csv ?? "")
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean)
        .map((u) => u.replace(/\/$/, ""));

export const normalizeOrigin = (value: string): string => {
    try {
        return new URL(value).origin;
    } catch {
        return value.replace(/\/$/, "");
    }
};

export const isPrivateIpv4 = (host: string): boolean => {
    const parts = host.split(".").map((part) => Number.parseInt(part, 10));
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return false;
    const first = parts[0]!;
    const second = parts[1]!;
    if (first === 10) return true;
    if (first === 192 && second === 168) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    return false;
};

export const isAllowedOrigin = (origin: string | undefined, allowedOrigins: Set<string>, isDev: boolean): boolean => {
    if (!origin) return true;
    if (allowedOrigins.has(normalizeOrigin(origin))) return true;
    if (!isDev && allowedOrigins.size === 0) return true;
    if (!isDev) return false;
    try {
        const parsed = new URL(origin);
        const host = parsed.hostname;
        const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
        if (isLocalHost) return true;
        if (host.endsWith(".local")) return true;
        return isPrivateIpv4(host);
    } catch {
        return false;
    }
};
