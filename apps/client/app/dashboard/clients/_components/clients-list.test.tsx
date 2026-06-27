import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getServerApiBase } from "@/lib/api-base";
import { ClientsList } from "./clients-list";

vi.mock("@/lib/api-base", () => ({
    getServerApiBase: vi.fn(),
}));

vi.mock("./client-card", () => ({
    ClientCard: ({ client }: { client: { name: string } }) => <article>{client.name}</article>,
}));

const mockedGetServerApiBase = vi.mocked(getServerApiBase);

describe("ClientsList", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        mockedGetServerApiBase.mockReset();
    });

    it("récupère les clients avec les filtres valides et affiche la liste", async () => {
        mockedGetServerApiBase.mockReturnValue("https://api.local");
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                total: 2,
                page: 2,
                pageSize: 10,
                items: [
                    {
                        id: "client-1",
                        name: "Kahier",
                        segment: "PME",
                        status: "ACTIVE",
                        location: "Paris",
                        notes: null,
                        revenueSource: "REFERRAL",
                        contactsCount: 2,
                        owner: null,
                        primaryEmail: "hello@kahier.fr",
                        primaryPhone: null,
                        emails: ["hello@kahier.fr"],
                        phones: [],
                        interactions: [
                            {
                                id: "interaction-1",
                                type: "Email",
                                summary: "Relance",
                                occurredAt: "2026-01-12T10:00:00.000Z",
                                user: null,
                            },
                        ],
                    },
                    {
                        id: "client-2",
                        name: "Atelier Nord",
                        segment: "TPE",
                        status: "PROSPECT",
                        location: "Lille",
                        notes: null,
                        revenueSource: null,
                        contactsCount: 1,
                        owner: null,
                        primaryEmail: null,
                        primaryPhone: null,
                        emails: [],
                        phones: [],
                        interactions: [],
                    },
                ],
            }),
        });
        vi.stubGlobal("fetch", fetchMock);

        render(
            await ClientsList({
                currentUserId: "user-1",
                currentUserRole: "MANAGER",
                searchParams: {
                    page: "2",
                    pageSize: "10",
                    q: "  kahier  ",
                    status: "ACTIVE",
                    segment: "PME",
                    location: "  Paris  ",
                },
            }),
        );

        expect(screen.getByText("2 clients")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Kahier" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Atelier Nord" })).toBeInTheDocument();
        expect(fetchMock).toHaveBeenCalledWith(
            "https://api.local/clients?page=2&pageSize=10&status=ACTIVE&segment=PME&location=Paris&q=kahier",
            {
                cache: "no-store",
                headers: { "x-user-id": "user-1" },
            },
        );
    });

    it("ignore les filtres invalides avant l'appel API", async () => {
        mockedGetServerApiBase.mockReturnValue("https://api.local");
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 }),
        });
        vi.stubGlobal("fetch", fetchMock);

        render(
            await ClientsList({
                currentUserId: "",
                currentUserRole: "ADMIN",
                searchParams: {
                    status: "DELETED",
                    segment: "VIP",
                    page: "not-a-number",
                    pageSize: "0",
                },
            }),
        );

        expect(fetchMock).toHaveBeenCalledWith("https://api.local/clients?page=1&pageSize=20", {
            cache: "no-store",
            headers: undefined,
        });
        expect(screen.getByText("Aucun client ne correspond à ces filtres pour le moment.")).toBeInTheDocument();
    });

    it("affiche un message dédié quand l'API est indisponible", async () => {
        mockedGetServerApiBase.mockReturnValue("https://api.local");
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

        render(
            await ClientsList({
                currentUserId: "user-1",
                currentUserRole: "USER",
                searchParams: {},
            }),
        );

        expect(screen.getByText("Le service clients est momentanément indisponible.")).toBeInTheDocument();
    });

    it("échoue explicitement quand aucune URL API n'est configurée", async () => {
        mockedGetServerApiBase.mockReturnValue(null);

        await expect(
            ClientsList({
                currentUserId: "user-1",
                currentUserRole: "USER",
                searchParams: {},
            }),
        ).rejects.toThrow("NEXT_PUBLIC_API_URL manquant pour récupérer les clients");
    });
});
