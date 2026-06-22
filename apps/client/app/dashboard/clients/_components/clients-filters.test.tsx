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
        navigationMocks.params = new URLSearchParams({
            q: "kahier",
            status: "ACTIVE",
            segment: "PME",
            location: "Paris",
        });

        render(
            <ClientsFilters
                searchParams={{
                    q: "kahier",
                    status: "ACTIVE",
                    segment: "PME",
                    location: "Paris",
                }}
            />,
        );

        expect(screen.getByLabelText("Recherche")).toHaveValue("kahier");
        expect(screen.getByText("2 filtres actifs")).toBeInTheDocument();
        expect(screen.getByText("ACTIVE")).toBeInTheDocument();
        expect(screen.getAllByText("PME").length).toBeGreaterThan(0);
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

        expect(screen.getByText("0 filtre actif")).toBeInTheDocument();
        expect(screen.queryByText("DELETED")).not.toBeInTheDocument();
        expect(screen.queryByText("VIP")).not.toBeInTheDocument();
    });

    it("applique la recherche après debounce", () => {
        render(<ClientsFilters searchParams={{}} />);

        fireEvent.change(screen.getByLabelText("Recherche"), {
            target: { value: "  atelier  " },
        });

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(navigationMocks.replace).toHaveBeenLastCalledWith("/dashboard/clients?page=1&q=atelier");
    });

    it("réinitialise les filtres", () => {
        render(<ClientsFilters searchParams={{ q: "kahier", status: "ACTIVE" }} />);

        fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));

        expect(navigationMocks.replace).toHaveBeenLastCalledWith("/dashboard/clients");
    });
});
