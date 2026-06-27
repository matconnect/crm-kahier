import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

import { ClientCard } from "./client-card";

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("./delete-client-dialog", () => ({
    DeleteClientDialog: () => <button>Supprimer</button>,
}));

describe("ClientCard", () => {
    it("affiche les informations principales du client", () => {
        render(
            <ClientCard
                currentUserId="user-1"
                client={{
                    id: "client-1",
                    name: "Kahier",
                    segment: "PME",
                    status: "ACTIVE",
                    location: "Paris",
                    revenueSource: "REFERRAL",
                    owner: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
                    contactsCount: 2,
                    primaryEmail: "hello@kahier.fr",
                    primaryPhone: "+33123456789",
                    emails: ["hello@kahier.fr"],
                    phones: ["+33123456789"],
                    notes: "Compte stratégique",
                    interactions: [
                        {
                            id: "interaction-1",
                            type: "Email",
                            summary: "Premier échange",
                            occurredAt: "2026-01-12T10:00:00.000Z",
                        },
                    ],
                }}
            />,
        );

        expect(screen.getByRole("link", { name: "Kahier" })).toHaveAttribute("href", "/dashboard/clients/client-1");
        expect(screen.getByText("PME")).toBeInTheDocument();
        expect(screen.getByText("Client actif")).toBeInTheDocument();
        expect(screen.getByText("Paris")).toBeInTheDocument();
        expect(screen.getByText("2 contacts")).toBeInTheDocument();
        expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
        expect(screen.getByText("hello@kahier.fr")).toBeInTheDocument();
        expect(screen.getByText("+33123456789")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Voir le détail" })).toHaveAttribute("href", "/dashboard/clients/client-1");
        expect(screen.getByRole("link", { name: "Modifier" })).toHaveAttribute("href", "/dashboard/clients/client-1?edit=1");
    });

    it("affiche les libellés de repli quand les données optionnelles sont absentes", () => {
        render(
            <ClientCard
                currentUserId="user-1"
                client={{
                    id: "client-2",
                    name: "Prospect Sud",
                    segment: "OTHER",
                    status: "PROSPECT",
                    location: null,
                    revenueSource: null,
                    owner: null,
                    contactsCount: 0,
                    primaryEmail: null,
                    primaryPhone: null,
                    emails: [],
                    phones: [],
                    notes: null,
                    interactions: [],
                }}
            />,
        );

        expect(screen.getByText("AUTRE")).toBeInTheDocument();
        expect(screen.getByText("Prospect")).toBeInTheDocument();
        expect(screen.getAllByText("Non renseigné").length).toBeGreaterThan(0);
        expect(screen.getByText("0 contact")).toBeInTheDocument();
        expect(screen.getByText("Non assigné")).toBeInTheDocument();
        expect(screen.getByText("Aucune")).toBeInTheDocument();
    });
});
