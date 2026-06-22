import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { InvoiceFilters } from "./invoice-filters";

const navigationMocks = vi.hoisted(() => ({
    replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: navigationMocks.replace }),
}));

describe("InvoiceFilters", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        navigationMocks.replace.mockReset();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it("met à jour l'URL de façon dynamique sans bouton de soumission", () => {
        render(<InvoiceFilters initialQuery="" initialStatus="SENT" />);

        fireEvent.change(screen.getByPlaceholderText("Numéro ou client"), {
            target: { value: "  acme  " },
        });

        act(() => {
            vi.advanceTimersByTime(260);
        });

        expect(navigationMocks.replace).toHaveBeenLastCalledWith("/dashboard/factures?q=acme&status=SENT");
        expect(screen.queryByRole("button", { name: /filtrer/i })).not.toBeInTheDocument();
    });

    it("répercute les nouvelles props dans les champs", () => {
        const { rerender } = render(<InvoiceFilters initialQuery="kahier" initialStatus="DRAFT" />);

        expect(screen.getByPlaceholderText("Numéro ou client")).toHaveValue("kahier");

        rerender(<InvoiceFilters initialQuery="atelier" initialStatus="PAID" />);

        expect(screen.getByPlaceholderText("Numéro ou client")).toHaveValue("atelier");
    });
});
