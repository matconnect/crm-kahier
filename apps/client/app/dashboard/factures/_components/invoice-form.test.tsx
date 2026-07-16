import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { InvoiceForm } from "./invoice-form";

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

describe("InvoiceForm", () => {
    it("expose l'id attendu par le bouton de création dans l'en-tête", () => {
        const { container } = render(<InvoiceForm currentUserId="user-1" clients={[]} />);

        expect(container.querySelector("form#invoice-form")).toBeInTheDocument();
    });
});
