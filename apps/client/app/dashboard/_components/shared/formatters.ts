export function formatTime(input: string) {
    return new Date(input).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatNowLabel() {
    return new Date().toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatNowLabelAt(date: Date) {
    return date.toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function getGreetingAt(date: Date) {
    const hour = date.getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
}
