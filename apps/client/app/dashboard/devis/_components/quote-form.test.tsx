import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { QuoteForm } from "./quote-form";

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
        replace: vi.fn(),
    }),
}));

vi.mock("@/lib/public-api-base", () => ({
    getBrowserApiBase: () => "https://api.local",
}));

describe("QuoteForm", () => {
    it("expose l'id attendu par le bouton de création dans l'en-tête", () => {
        const { container } = render(<QuoteForm currentUserId="user-1" clients={[]} />);

        expect(container.querySelector("form#quote-form")).toBeInTheDocument();
    });
});
