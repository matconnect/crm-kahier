import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuoteFilters } from "./quote-filters";

const navigationMocks = vi.hoisted(() => ({
    replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => navigationMocks,
}));

describe("QuoteFilters", () => {
    it("met à jour les filtres dynamiquement", async () => {
        render(<QuoteFilters initialQuery="" initialStatus="SENT" />);

        fireEvent.change(screen.getByPlaceholderText("Numéro ou client"), {
            target: { value: "acme" },
        });

        fireEvent.click(screen.getByRole("combobox"));
        fireEvent.click(screen.getAllByText("Validé")[1]!);

        await waitFor(() => {
            expect(navigationMocks.replace).toHaveBeenLastCalledWith("/dashboard/devis?q=acme&status=SENT");
        });
    });

    it("resynchronise l’état local quand les props changent", () => {
        const { rerender } = render(<QuoteFilters initialQuery="kahier" initialStatus="DRAFT" />);

        expect(screen.getByDisplayValue("kahier")).toBeInTheDocument();

        rerender(<QuoteFilters initialQuery="atelier" initialStatus="ACCEPTED" />);

        expect(screen.getByDisplayValue("atelier")).toBeInTheDocument();
    });
});
