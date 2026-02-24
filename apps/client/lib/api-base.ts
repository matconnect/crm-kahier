export function getServerApiBase(): string | null {
    return process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? null;
}
