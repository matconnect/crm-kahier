export function getBrowserApiBase(): string | null {
    if (typeof window !== "undefined") {
        return "";
    }

    const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, "");
    }

    return null;
}
