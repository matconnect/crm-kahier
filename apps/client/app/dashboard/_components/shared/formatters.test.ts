import { afterEach, describe, expect, it, vi } from "vitest";

import { formatNowLabel, formatNowLabelAt, formatTime, getGreetingAt } from "./formatters";

describe("dashboard formatters", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it.each([
        ["2026-01-01T09:05:00", "09:05"],
        ["2026-01-01T18:30:00", "18:30"],
        ["2026-01-01T23:59:00", "23:59"],
    ])("formate l'heure %s", (input, expected) => {
        expect(formatTime(input)).toBe(expected);
    });

    it.each([
        [new Date("2026-01-01T08:00:00"), "Bonjour"],
        [new Date("2026-01-01T11:59:00"), "Bonjour"],
        [new Date("2026-01-01T12:00:00"), "Bon après-midi"],
        [new Date("2026-01-01T17:59:00"), "Bon après-midi"],
        [new Date("2026-01-01T18:00:00"), "Bonsoir"],
        [new Date("2026-01-01T23:00:00"), "Bonsoir"],
    ])("retourne la salutation attendue", (date, expected) => {
        expect(getGreetingAt(date)).toBe(expected);
    });

    it("formate un libellé maintenant depuis une date donnée", () => {
        expect(formatNowLabelAt(new Date("2026-06-15T14:30:00"))).toContain("15");
    });

    it("formate le libellé maintenant avec l'horloge courante", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-15T14:30:00"));

        expect(formatNowLabel()).toContain("15");
    });
});
