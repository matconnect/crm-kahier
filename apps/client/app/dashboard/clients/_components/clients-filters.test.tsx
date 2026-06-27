import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClientsFilters } from "./clients-filters";

const navigationMocks = vi.hoisted(() => ({
    replace: vi.fn(),
    params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: navigationMocks.replace }),
    useSearchParams: () => navigationMocks.params,
}));

describe("ClientsFilters", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        navigationMocks.replace.mockReset();
        navigationMocks.params = new URLSearchParams();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it("affiche les filtres actifs valides", () => {
        render(
            <ClientsFilters
                searchParams={{
                    q: "kahier",
                    status: "ACTIVE",
                    segment: "PME",
                }}
            />,
        );

        const [statusSelect, segmentSelect] = screen.getAllByRole("combobox");

        expect(screen.getByPlaceholderText("Nom du client ou contact")).toHaveValue("kahier");
        expect(statusSelect).toHaveTextContent("Client actif");
        expect(segmentSelect).toHaveTextContent("PME");
    });

    it("ignore les valeurs de statut et segment invalides", () => {
        render(
            <ClientsFilters
                searchParams={{
                    status: "DELETED",
                    segment: "VIP",
                }}
            />,
        );

        const [statusSelect, segmentSelect] = screen.getAllByRole("combobox");

        expect(statusSelect).toHaveTextContent("Tous les statuts");
        expect(segmentSelect).toHaveTextContent("Tous les segments");
        expect(screen.queryByText("DELETED")).not.toBeInTheDocument();
        expect(screen.queryByText("VIP")).not.toBeInTheDocument();
    });

    it("applique la recherche après debounce", () => {
        render(<ClientsFilters searchParams={{}} />);

        fireEvent.change(screen.getByPlaceholderText("Nom du client ou contact"), {
            target: { value: "  atelier  " },
        });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(navigationMocks.replace).toHaveBeenLastCalledWith("/dashboard/clients?q=atelier");
    });

    it("revient à la route de base quand la recherche est vidée", () => {
        render(<ClientsFilters searchParams={{ q: "kahier" }} />);

        fireEvent.change(screen.getByPlaceholderText("Nom du client ou contact"), {
            target: { value: "   " },
        });

        act(() => {
            vi.advanceTimersByTime(250);
        });

        expect(navigationMocks.replace).toHaveBeenLastCalledWith("/dashboard/clients");
    });
});
