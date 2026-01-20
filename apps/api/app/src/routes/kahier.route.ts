import { Router } from "express";

type KahierPeriodeTab = {
    id: number;
    name: string;
    label: string;
    zoneId: number;
    establishmentId: number;
    createdAt: string;
    updatedAt: string;
    isGeneral: boolean;
    planningId: number | null;
};

type KahierCategory = {
    id: number;
    name: string;
    displayOrder: number;
    periodeTabId: number;
    createdAt: string;
    updatedAt: string;
    color?: string | null;
};

const router = Router();

router.get("/zone/:zoneId", async (req, res) => {
    const { zoneId } = req.params;
    const baseUrl = process.env.KAHIER_API_BASE ?? "https://cdl-back.kahier.com/api";
    const headers: HeadersInit = { Accept: "application/json" };
    if (process.env.KAHIER_API_TOKEN) {
        headers.Authorization = `Bearer ${process.env.KAHIER_API_TOKEN}`;
    }

    try {
        const tabsRes = await fetch(`${baseUrl}/periodes/zone/?zoneId=${zoneId}`, { headers });
        if (!tabsRes.ok) {
            return res.status(tabsRes.status).json({ error: "Impossible de récupérer les onglets." });
        }
        const periodes = (await tabsRes.json()) as KahierPeriodeTab[];
        const categoriesEntries = await Promise.all(
            periodes.map(async (periode) => {
                const catRes = await fetch(`${baseUrl}/categories/${periode.id}`, { headers });
                if (!catRes.ok) return [String(periode.id), []] as const;
                const categories = (await catRes.json()) as KahierCategory[];
                return [String(periode.id), categories] as const;
            }),
        );

        const categoriesByPeriode = Object.fromEntries(categoriesEntries);
        return res.json({ periodes, categoriesByPeriode });
    } catch (error) {
        console.error("Erreur kahier zone:", error);
        return res.status(500).json({ error: "Erreur serveur" });
    }
});

export default router;
