export function splitUrls(csv?: string) {
    return (csv ?? "")
        .split(",")
        .map((url) => url.trim())
        .filter(Boolean)
        .map((url) => url.replace(/\/$/, ""));
}
