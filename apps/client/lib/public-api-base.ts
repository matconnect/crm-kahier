export function getBrowserApiBase(): string | null {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (fromEnv) {
        if (typeof window !== "undefined") {
            try {
                const parsed = new URL(fromEnv);
                const envHost = parsed.hostname;
                const browserHost = window.location.hostname;
                const envIsLocal = envHost === "localhost" || envHost === "127.0.0.1" || envHost === "::1";
                const browserIsLocal =
                    browserHost === "localhost" || browserHost === "127.0.0.1" || browserHost === "::1";

                if (envIsLocal && !browserIsLocal) {
                    parsed.hostname = browserHost;
                    return parsed.toString().replace(/\/$/, "");
                }
                return parsed.toString().replace(/\/$/, "");
            } catch {
                return fromEnv.replace(/\/$/, "");
            }
        }
        return fromEnv.replace(/\/$/, "");
    }

    if (typeof window === "undefined") {
        return null;
    }

    try {
        return window.location.origin.replace(/\/$/, "");
    } catch {
        return null;
    }
}
