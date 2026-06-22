import { describe, expect, it } from "vitest";

import { slugify } from "./slugify";

describe("slugify", () => {
    it.each([
        ["Kahier CRM", "kahier-crm"],
        ["  Kahier CRM  ", "kahier-crm"],
        ["Équipe commerciale", "equipe-commerciale"],
        ["Déjà Vu", "deja-vu"],
        ["Client & Prospect", "client-prospect"],
        ["Factures / Devis", "factures-devis"],
        ["PME + ETI", "pme-eti"],
        ["Projet #42", "projet-42"],
        ["2026 Roadmap", "2026-roadmap"],
        ["---Kahier---", "kahier"],
        ["multi     espace", "multi-espace"],
        ["Nîmes, France", "nimes-france"],
        ["ÇA MARCHE", "ca-marche"],
        ["", ""],
        ["!!!", ""],
    ])("transforme %s en %s", (input, expected) => {
        expect(slugify(input)).toBe(expected);
    });
});
