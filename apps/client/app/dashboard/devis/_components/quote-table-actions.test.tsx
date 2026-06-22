import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QuoteTableActions } from "./quote-table-actions";

const routerMocks = vi.hoisted(() => ({
    refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ refresh: routerMocks.refresh }),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("@/lib/public-api-base", () => ({
    getBrowserApiBase: () => "https://api.local",
}));

describe("QuoteTableActions", () => {
    beforeEach(() => {
        routerMocks.refresh.mockReset();
        vi.stubGlobal("fetch", vi.fn());
        Object.defineProperty(URL, "createObjectURL", {
            configurable: true,
            value: vi.fn(() => "blob:quote-preview"),
        });
        Object.defineProperty(URL, "revokeObjectURL", {
            configurable: true,
            value: vi.fn(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("ouvre un aperçu PDF local pour un devis brouillon", async () => {
        const fetchMock = vi.mocked(fetch);
        fetchMock.mockResolvedValueOnce({
            ok: true,
            blob: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
        } as unknown as Response);

        render(<QuoteTableActions quoteId="quote-1" quoteNumber="DEV-2026-0001" currentUserId="user-1" status="DRAFT" />);

        fireEvent.click(screen.getByRole("button", { name: "Aperçu" }));

        await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("https://api.local/quotes/quote-1/pdf", expect.any(Object)));
        await waitFor(() => expect(screen.getByTitle("Aperçu PDF devis")).toHaveAttribute("src", "blob:quote-preview"));
        expect(screen.queryByRole("button", { name: "Télécharger" })).not.toBeInTheDocument();
    });

    it("affiche uniquement le téléchargement pour un devis non modifiable", () => {
        render(<QuoteTableActions quoteId="quote-2" quoteNumber="DEV-2026-0002" currentUserId="user-1" status="ACCEPTED" />);

        expect(screen.getByRole("combobox")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Télécharger" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Aperçu" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Valider" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Supprimer" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Modifier" })).not.toBeInTheDocument();
    });
});
