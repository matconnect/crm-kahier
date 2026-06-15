export function getBrowserApiBase(): string | null {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (fromEnv) {
        return fromEnv.replace(/\/$/, "");
    }

    if (typeof window !== "undefined") {
        return window.location.origin.replace(/\/$/, "");
    }

    return null;
}
